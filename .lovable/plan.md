# خطة: أداة Fetch URL + نظام Skills (مهارات)

## الجزء 1 — أداة Fetch URL

أداة جديدة تسمح للـ AI بفتح رابط محدد، استخراج محتواه (markdown + عنوان + ميتا) واستخدامه في الإجابة. مختلفة عن `WEB_SEARCH` (بحث عام) و`BROWSE_WEBSITE` (تصفح تفاعلي بمتصفح حقيقي عبر HB) — هذه أخف وأسرع وللـ "اقرأ هذه الصفحة وحدّثني".

### Backend (`supabase/functions/chat/index.ts`)
- إضافة اسم أداة جديد `FETCH_URL` للـ `INTERNAL_TOOLS` set ولقائمة الأدوات المعرّفة في الـ tools array بـ schema:
  - `url` (string, required)
  - `extract` (enum: `summary | full | metadata`, default `summary`)
- handler ينفذ fetch مباشر للصفحة، يستخدم Readability البسيط (regex/strip tags) لاستخراج النص + العنوان + الـ description، ويرجع للـ AI نص نظيف مقصوص (~6000 حرف). لو URL غير صالح يرجع رسالة خطأ نظيفة بدون فتح Composio flow.
- تحديث الـ system prompt في الأماكن اللي بتذكر الأدوات تضيف وصف لـ `FETCH_URL`: "use when the user provides a specific URL to read or summarize."

### Frontend (Plus Sheet)
- إضافة Row جديد في `ChatPlusSheet` تحت "Web search" اسمه "Fetch URL" بأيقونة `Link2`. الضغط عليها يفتح حوار صغير (input + زر Send) والنتيجة تنحقن في الرسالة كـ `[Fetch URL: <url>]` عشان الـ AI يستدعي الأداة. أو ببساطة: زر Toggle مماثل لـ Web search اسمه "Auto-read links" لو الـ user حطّ رابط في رسالته يقرأه تلقائياً.

## الجزء 2 — نظام Skills (مهارات)

### المفهوم
المهارة = (اسم + وصف + تعليمات system + أدوات مفعّلة + موديل مفضّل اختياري). المستخدم يقدر:
- يختار مهارة معينة من زر `+` في الـ Plus Sheet (تظهر chip فوق الـ input، ويتم حقن تعليماتها وموديلها وأدواتها لكل رسالة).
- أو يخليها على Auto: الـ AI يقرأ list المهارات (الاسم + الوصف فقط) وكل turn يقرر بنفسه أيها يطبّق (عبر تعليمة في system prompt).

### قاعدة البيانات (migration جديدة)

**جدول `skills`** (مهارات المستخدم):
- `id`, `user_id` (auth.users), `name`, `description`, `instructions` (text)
- `enabled_tools` (text[]) — أسماء أدوات من القائمة الموجودة
- `preferred_model` (text, nullable)
- `icon` (text, nullable) — اسم أيقونة lucide
- `is_active` (bool, default true)
- `created_at`, `updated_at`
- RLS: المستخدم يدير صفوفه فقط

**جدول `system_skills`** (مكتبة جاهزة من النظام، read-only للمستخدم):
- نفس الأعمدة بدون `user_id`، + `display_order`, `is_active`
- RLS: SELECT للجميع، التعديل service_role فقط
- seed: مبرمج، باحث، كاتب محتوى، مترجم، ملخّص دراسي، مستشار تسويق… (5–8 مهارات افتراضية)

**جدول `user_skill_preferences`** (لتتبع المهارات الجاهزة المضافة من المستخدم):
- `user_id`, `system_skill_id`, `is_pinned` — أو ببساطة نسمح للمستخدم يعمل "نسخ" من system skill إلى skills الخاصة به.

### صفحة الإعدادات
- Route جديد `/settings/skills` (يضاف لـ `SettingsPage.tsx` تحت قائمة الـ Workspace items بعنوان "Skills" وأيقونة `Sparkles`).
- صفحة بـ tab علوي: "Mine" / "Library":
  - **Library**: عرض system_skills كبطاقات + زر "Add to mine" ينسخها لجدول skills الخاص بالمستخدم.
  - **Mine**: list مهارات المستخدم مع زر تعديل/حذف، وزر "+ New skill" يفتح فورم (الاسم، الوصف، التعليمات textarea، multi-select للأدوات المتاحة من thawابت معرّفة في `src/lib/skillTools.ts`، dropdown للموديل المفضل).

### اختيار المهارة في الشات

**state في `ChatPage.tsx`**:
- `activeSkill: Skill | null` يُخزن في `localStorage` مع conversation_id (يستمر للجلسة).
- `skillMode: "auto" | "manual"` — افتراضي auto.

**في `ChatPlusSheet.tsx`**: Row جديد "Skills" قبل "Integrations" بأيقونة `Sparkles`. الضغط يفتح Sheet ثاني صغير (`SkillsPickerSheet`) فيه:
- خيار "Auto" (الـ AI يقرر) — ✓ افتراضي.
- list مهارات المستخدم + المضافة من الـ library.
- زر "Manage skills →" يفتح `/settings/skills`.

**عند اختيار مهارة**: تظهر chip ملوّنة فوق الـ input (شبيه `AgentBadge`) فيها اسم المهارة + × لإزالتها (يرجع للـ Auto).

### تمرير المهارة للـ Backend

**`streamChat.ts`**: إضافة بارامتر `activeSkill?: { id, name, instructions, enabled_tools, preferred_model }` و`availableSkills?: Array<{ name, description }>` (للـ Auto mode).

**في `supabase/functions/chat/index.ts`**:
- لو `activeSkill` موجود:
  - يُحقن `activeSkill.instructions` في بداية الـ system prompt تحت قسم `<active_skill>`.
  - الـ tools المعرّفة في request تُفلتر/تُمنح أولوية لـ `enabled_tools`.
  - `preferred_model` يتجاوز اختيار الموديل العادي (مع نفس fallback logic الموجود).
- لو لا يوجد `activeSkill` و`availableSkills.length > 0`:
  - يُضاف قسم في system prompt: "Available skills you may apply when relevant:" + bullets لكل (name — description). وتعليمات: "Silently apply the matching skill's tone/expertise; never name it to the user."

## التقنيات
- React Query لجلب الـ skills في صفحة الإعدادات.
- Zod validation للفورم.
- Hook جديد `useSkills.ts` يرجع `mySkills`, `librarySkills`, `activeSkill`, `setActiveSkill`.
- ملف `src/lib/skillTools.ts` فيه قائمة الأدوات المتاحة للاختيار (WEB_SEARCH, BROWSE_WEBSITE, FETCH_URL, GENERATE_IMAGE, …) بأسماء عرض عربية.

## الملفات المتأثرة
- جديدة: `src/pages/SkillsSettingsPage.tsx`, `src/components/chat/SkillsPickerSheet.tsx`, `src/components/SkillBadge.tsx`, `src/hooks/useSkills.ts`, `src/lib/skillTools.ts`, migration SQL.
- معدّلة: `src/pages/ChatPage.tsx`, `src/components/chat/ChatPlusSheet.tsx`, `src/lib/streamChat.ts`, `src/pages/SettingsPage.tsx`, `src/App.tsx` (route), `supabase/functions/chat/index.ts`.

## ترتيب التنفيذ
1. Migration للجداول الثلاثة + seed system_skills.
2. Backend: أداة `FETCH_URL` + استقبال `activeSkill`/`availableSkills`.
3. Hook + صفحة الإعدادات `/settings/skills` (CRUD + Library).
4. SkillsPickerSheet + Row جديد في ChatPlusSheet + chip في ChatPage.
5. تمرير الـ skill في `streamChat`.
6. تجربة كاملة على preview.
