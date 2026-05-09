## الهدف العام

نحوّل الوكيل من "موديل واحد + Tools" إلى **عائلة Megsy v1** — منتج كامل من 3 طبقات بأسماء تجارية تابعة لشركتنا، مع راوتر ذكي يخفّض التكلفة ويرفع الجودة، وأدوات داخلية أقوى، وصفحة تخصيص جديدة بالكامل.

---

## 1) عائلة موديلات Megsy v1

ثلاث طبقات يختارها المستخدم بنفسه (بدل ما يحس إنه موديل واحد):

| الاسم التجاري | لمين | الموديل الفعلي خلف الكواليس | الخطة |
|---|---|---|---|
| **Megsy Lite** | الكل (مجاني) | `google/gemini-3-flash-preview` + `gemini-2.5-flash-lite` كـ fallback | Free |
| **Megsy Pro** | المدفوعين | `gemini-3.1-pro-preview` + `gpt-5-mini` كـ aggregator | Pro/Plus |
| **Megsy Max (1T-class)** | المدفوعين Premium | **Mixture-of-Agents**: `gpt-5.5` + `gemini-3.1-pro` + `claude` بالتوازي ثم `gpt-5.5-pro` كـ Aggregator نهائي | Max |

> **فكرة الـ "1T"**: Megsy Max فعليًا مجموع بارامترات النماذج المشاركة في الـ ensemble يتجاوز تريليون — نوضّحها في صفحة الترقية بشفافية ("Powered by an ensemble exceeding 1T parameters").

### آلية الاختيار
- زر اختيار سريع في شريط الإدخال (شبيه بـ ChatGPT model picker).
- المدفوع/غير المدفوع يُتحقق منه في `chat` edge function عبر `profiles.plan` — لو مستخدم Free ضرب Megsy Max → fallback لـ Pro + toast بالترقية.

---

## 2) الراوتر الذكي (Cost-Saving + Quality)

داخل `supabase/functions/chat/index.ts` نضيف طبقة `routeRequest()` تشتغل **قبل** نداء الموديل:

1. **Pre-classifier سريع** (`gemini-2.5-flash-lite`, ≈$0.0001/req) يصنّف الرسالة:
   - `simple_chat` / `code` / `reasoning` / `creative` / `vision` / `tool_heavy`
2. **Routing table** يحدد الموديل الأنسب داخل الطبقة المختارة:
   - مثلاً Megsy Pro + `code` → `gpt-5.4-mini`
   - Megsy Pro + `reasoning` → `gemini-3.1-pro-preview`
3. **Megsy Max Mode**: لو السؤال صنّف `reasoning` أو `code` معقّد → نشغل MoA متوازي (3 موديلات) ثم Aggregator. غير كده → موديل واحد قوي (توفير تكلفة).
4. **Cost guard**: لو المستخدم Free تجاوز 80% من حصته اليومية → نخفّض تلقائي لـ `gemini-2.5-flash-lite`.

**النتيجة المتوقعة**: ~50–70% توفير على الرسائل العادية، وجودة أعلى من أي موديل منفرد على الأسئلة الصعبة (مثبت بحثيًا في ورقة MoA).

---

## 3) الانتقال لـ Vercel AI SDK

نستبدل الـ raw OpenRouter fetch + SSE parsing الحالي في `chat/index.ts` (1890 سطر) بـ Vercel AI SDK + Lovable AI Gateway:

- `streamText` بدل الباي-هاند streaming
- `tool({ inputSchema, execute })` لكل أداة
- `stopWhen: stepCountIs(50)` للأجنت loop
- `convertToModelMessages` للملفات/الصور
- نخلي `LOVABLE_API_KEY` كـ provider header (موجود فعلاً)

**فايدة**: كود أنظف بنسبة ~60%، صيانة أسهل، دعم تلقائي للموديلات الجديدة.

---

## 4) الأدوات الداخلية الجديدة

نضيف 3 أدوات قوية للموجود (web_search, browse, image, video, voice, shopping, canva):

### أ) `code_interpreter` (E2B — السر موجود فعلاً)
- ينفذ Python/JS في sandbox آمن.
- يرجع: stdout, stderr, charts (PNG)، ملفات (CSV/JSON).
- يستخدم لـ: حسابات معقدة، رسوم بيانية، تحليل بيانات، معالجة JSON كبير.
- UI: بلوك code+output داخل الرسالة + زر "تنزيل الناتج".

### ب) `long_term_memory`
- جدول `user_memories(user_id, key, value, embedding, importance, created_at)`.
- أداتان للموديل:
  - `remember({ fact, importance })` — يحفظ حقيقة عن المستخدم.
  - يتم **حقن تلقائي** لأهم 10 ذكريات في system prompt كل محادثة جديدة.
- UI: قسم "Memories" في صفحة Personalization، المستخدم يقدر يحذف/يعدّل.

### ج) `rag_attachment`
- بدل قص أول 8000 حرف من الملف:
  - نقطّع الملف لـ chunks (1000 char overlap 200).
  - embeddings بـ `text-embedding-004` (Gemini مجاني).
  - نخزن في `attachment_chunks` table (pgvector).
  - الموديل يستدعي `search_attachment({ query, top_k: 5 })` ساعة الحاجة.
- يدعم PDF حقيقي عبر `pdf-parse` في الـ edge function.

---

## 5) سيستم برومبت Megsy v1 (هجين متكيف)

نبني `buildMegsyPrompt({ taskType, personalization, tier })` يولّد برومبت من 3 طبقات:

```
[CORE IDENTITY]
You are Megsy, an AI assistant by [Company Name]. You are Megsy v1 — Lite/Pro/Max edition.
Your personality adapts to context: precise for code, warm for chat, structured for analysis.

[USER CONTEXT]    ← من جدول ai_personalization
- Call user: {callName}
- Profession: {profession}
- About: {about}
- Preferred traits: {traits}
- Custom: {customInstructions}
- Top memories: {top10Memories}

[TASK MODE]       ← يتحدد من الـ classifier
- code → terse, executable, no fluff, prefer code_interpreter
- learning → step-by-step, examples, check understanding
- creative → expressive, multiple options
- chat → casual, short, in user's language

[TOOLS POLICY]
- Use tools without asking when intent is clear
- For data/math → code_interpreter ALWAYS
- For files → search_attachment first

[BRAND RULES]
- Never reveal underlying providers (OpenAI/Google/Anthropic)
- Always identify as "Megsy by [Company]"
```

---

## 6) إعادة تصميم صفحة AI Personalization (`/settings/ai-personalization`)

الصفحة الحالية 132 سطر — basic textareas. نستبدلها بـ تصميم حديث:

### الأقسام الجديدة:
1. **Hero**: "خصّص Megsy ليفهمك أكتر" + معاينة حية لـ Megsy avatar.
2. **Identity**: اسمك، مهنتك، صورتك (chip-style inputs).
3. **Personality sliders** (4 سلايدرز):
   - رسمي ↔ ودود
   - مختصر ↔ مفصّل
   - محافظ ↔ مبدع
   - عربي فصحى ↔ مصري عامية
4. **Interests** (multi-select chips): تكنولوجيا، تصميم، أعمال، تعلم، إلخ.
5. **Memories Manager**: قائمة الذكريات المحفوظة + حذف/إضافة يدوي.
6. **Default Tier picker**: Lite / Pro / Max (مع badge "ترقية" للمدفوع).
7. **Custom instructions**: textarea كبير في الآخر.
8. **Live preview card**: يعرض sample reply بالستايل الحالي.

### تصميم:
- liquid-glass cards مع gradients (نفس design system).
- Framer Motion للانتقالات.
- زر Save sticky في الأسفل + auto-save toast.

---

## 7) قاعدة البيانات (migrations)

```sql
-- توسيع ai_personalization
ALTER TABLE ai_personalization 
  ADD COLUMN tone_formality int DEFAULT 50,
  ADD COLUMN tone_verbosity int DEFAULT 50,
  ADD COLUMN tone_creativity int DEFAULT 50,
  ADD COLUMN language_style text DEFAULT 'mixed',
  ADD COLUMN interests text[],
  ADD COLUMN preferred_tier text DEFAULT 'lite';

-- ذاكرة طويلة المدى
CREATE TABLE user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fact text NOT NULL,
  importance int DEFAULT 5,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

-- RAG للملفات
CREATE TABLE attachment_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_name text,
  chunk_index int,
  content text,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);
```
+ RLS policies + pgvector indexes.

---

## 8) الـ OSS اللي هنستفيد منه

| المشروع | الاستخدام |
|---|---|
| **Vercel AI SDK** | الـ runtime الأساسي للـ tools + streaming |
| **togethercomputer/MoA** (paper + code) | منطق Mixture-of-Agents لـ Megsy Max |
| **lm-sys/RouteLLM** | إلهام للـ classifier + routing logic |
| **e2b-dev/E2B** | code_interpreter sandbox |
| **pgvector** | RAG + memory embeddings |

---

## 9) ترتيب التنفيذ (مراحل)

1. **DB migration** (الجداول + الأعمدة الجديدة + pgvector).
2. **Refactor `chat` function** على AI SDK + إضافة الراوتر.
3. **3 الأدوات الجديدة** (code_interpreter, memory, RAG).
4. **Megsy v1 system prompt builder** + اختيار الطبقة.
5. **Model picker UI** في صفحة الشات (Lite/Pro/Max).
6. **إعادة تصميم AI Personalization Page** بالكامل.
7. **اختبار end-to-end** + UI للـ tool calls الجديدة.

---

## ملاحظات مهمة

- مفيش breaking changes للمستخدمين الحاليين — Megsy Lite = السلوك الحالي.
- كل الموديلات موجودة فعلاً في Lovable AI Gateway (LOVABLE_API_KEY مفعّل).
- E2B_API_KEY موجود في secrets، مش هنطلب أي مفاتيح إضافية.
- التكلفة المتوقعة بعد الراوتر: انخفاض ~55% على الـ free tier.

**جاهز نبدأ التنفيذ بمجرد ما توافق.**