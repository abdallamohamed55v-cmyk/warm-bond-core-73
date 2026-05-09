# Megsy Deep Research v2 — خطة شاملة

## الهدف
1. نقل زر **Deep Research** فوق صندوق الإدخال مباشرة (toggle سريع).
2. بناء نظام بحث عميق متطور: أسئلة استيضاحية ذكية + خطة تفصيلية + ستريمنغ حيّ لما يفعله النموذج لحظيًا + تقرير ختامي مختصر.
3. استخدام مكوّن **Task Timeline** (نسخة محلية من ai-elements/task) لعرض السجل الحي.

---

## 1) واجهة المستخدم — تغييرات الـ Frontend

### (أ) زر Deep Research فوق Composer
- إضافة Pill toggle بسيط فوق `BottomInputBar` مباشرة (نفس مكان "Mode badge"):
  - أيقونة `Globe` + نص "Deep Research" + Switch صغير.
  - عند التفعيل: `setChatMode("deep-research")` + لون بنفسجي (`text-violet-400`).
  - عند الإلغاء: يرجع لـ `normal`.
- بجانبه pill ثانٍ اختياري: **Computer Use** (للحفاظ على نفس النمط البصري).
- إخفاء Deep Research من قائمة الـ Agents (لأنه أصبح وصول مباشر).

### (ب) مكوّن `ResearchTaskTimeline` (جديد)
- ملف جديد: `src/components/research/ResearchTaskTimeline.tsx`.
- يحاكي الـ `Task` component من ai-elements (بدون npm dep — نبنيه بأنفسنا بـ Tailwind + framer-motion).
- يحتوي على:
  - **TaskTrigger**: عنوان قابل للطي (Collapsible) — مثلاً "Researching… 12 sources scanned".
  - **TaskContent**: قائمة `TaskItem` متحركة (slide-in من اليسار).
  - **TaskItemFile**: chip صغير يحمل أيقونة (Search/FileText/Globe/Brain) + اسم المصدر/الاستعلام.
- أمثلة على عناصر:
  ```
  🔍 Searching "GPT-5 benchmarks vs Claude 4"
  📖 Reading [openai.com/blog/gpt-5]
  🧠 Analyzing 8 sources for patterns
  🌐 Cross-checking with arXiv: "transformer scaling laws"
  ✅ Synthesizing findings
  ```
- Auto-scroll لآخر مهمة + حالة `running | done | error` لكل عنصر.

### (ج) مكوّن `ResearchPlanCard` (جديد)
- يظهر فور انتهاء مرحلة التخطيط، قبل بدء التنفيذ.
- بطاقة بنفسجية بـ:
  - **العنوان**: "Research Plan"
  - **الهدف**: ملخص سؤال المستخدم بصيغة بحثية.
  - **الخطوات** (مرقّمة 1→N): مثل
    1. Define core terms and scope
    2. Gather primary sources (academic + news)
    3. Cross-reference with expert commentary
    4. Identify counter-arguments and limitations
    5. Synthesize into structured report
  - **زر**: "Approve & Start" / "Refine Plan" (اختياري — افتراضي auto-start بعد 2 ثانية).

### (د) مكوّن `ClarifyDialog` (جديد)
- يظهر فقط حين يقرر النموذج أن السؤال غامض (≤30% من الحالات).
- بطاقة فوق الـ Composer بـ 1-3 أسئلة استيضاحية ذكية:
  - إما اختيارات زر سريعة (chips)
  - أو حقل إجابة قصيرة
- زر "Skip & let Megsy decide" متاح دائمًا.
- بعد الإجابة → يُحقن السياق ويبدأ التخطيط.

### (هـ) مكوّن `ResearchSummaryCard` (جديد)
- يظهر بعد انتهاء البحث، فوق التقرير الكامل (`DeepResearchCard` الحالي).
- يحتوي:
  - **What I did**: 4-6 نقاط مختصرة (مثل "بحثت في 23 مصدرًا، قرأت 8 مقالات كاملة، قارنت 3 وجهات نظر متضاربة").
  - **Key findings**: 3 نقاط جوهرية.
  - **Sources scanned**: عدد + أيقونات قنوات (Web/Academic/News/Reddit).
  - **Time taken**: مدة التنفيذ.
  - **Confidence**: مرتفع/متوسط/منخفض مع تبرير سطري.

---

## 2) الـ Backend — أحداث SSE جديدة في `supabase/functions/chat/index.ts`

سنوسّع تدفق الأحداث (data: lines) بأنواع جديدة:

| Event | Payload | متى يُرسَل |
|---|---|---|
| `clarify_questions` | `{ questions: [{id, text, options?}] }` | إذا اعتبر النموذج السؤال غامضًا |
| `plan_detailed` | `{ goal, steps: string[] }` | بعد مرحلة التخطيط |
| `task_start` | `{ id, kind, label, target? }` | عند بدء كل مهمة فرعية |
| `task_update` | `{ id, label }` | تحديث حالة |
| `task_done` | `{ id, summary?, error? }` | عند انتهاء مهمة |
| `final_summary` | `{ what_i_did, key_findings, sources_count, channels, duration_ms, confidence }` | قبل التقرير النهائي |

(الـ events الحالية `plan` و `search_query` تبقى للتوافق الخلفي.)

---

## 3) خوارزمية الـ Deep Research v2 (تعديل `chat/index.ts`)

عند `isDeepResearch === true` نُفعّل **DeepResearchOrchestrator** بدل التدفق الحالي:

```text
المرحلة 1: Classifier (gemini-2.5-flash-lite — رخيص)
   → ambiguity_score (0-1), domain (tech/medical/finance/general/...)
   → إذا score > 0.55 وليست أول رسالة بسياق → أرسل clarify_questions ووقّف
   → غير ذلك → كمل

المرحلة 2: Planner (gemini-2.5-flash + JSON mode)
   → ينتج خطة { goal, sub_questions: 5-8, search_strategies: [...], expected_sources: [...] }
   → أرسل plan_detailed event

المرحلة 3: Executor (متوازي — 3 workers)
   لكل sub_question:
      a. WEB_SEARCH (Serper)        → task_start/done
      b. JINA_READ على top 2 URLs   → task_start/done
      c. Wikipedia (موجود)          → task_start/done
      d. arXiv (للمواضيع التقنية)   → task_start/done
      e. Reddit/HN (للآراء)         → task_start/done
   كل tool ينتج task event مع label واضح بلغة المستخدم.

المرحلة 4: Reflector (kimi-k2.5 أو claude-sonnet-4.5)
   → يفحص النتائج
   → يقرر: هل هناك فجوات؟ → ينتج 2-3 follow-up queries
   → يعيد المرحلة 3 (depth max=2)

المرحلة 5: Synthesizer (kimi-k2.5:nitro)
   → يبني تقرير منظم Markdown مع citations [n]
   → streaming عادي عبر choices.delta

المرحلة 6: Summarizer (gemini-2.5-flash — سريع وموازي للتقرير)
   → final_summary event قبل بدء التقرير الفعلي
```

### مفاتيح التحسين
- **Parallelism**: استخدام `Promise.all` لتشغيل 3-5 بحوث متزامنة لكل sub-question.
- **Token budget**: حد أقصى 12k token output، 25k context.
- **Source dedup**: hash عناوين URLs لمنع التكرار.
- **Citations**: كل ادعاء في التقرير يربط بـ `[n]` يحيل لمصدر URL.
- **Cost guard**: لـ Megsy Lite users → max 2 sub-questions، depth=1. Pro/Max → 8 sub-questions، depth=2.

---

## 4) ربط الأحداث في `streamChat.ts`
- توسيع `onEvent` ليتعامل مع الأنواع الجديدة (موجود أصلاً، نمرّر payload كما هو).
- إضافة callbacks اختيارية مكرّسة:
  - `onClarifyQuestions(qs)`
  - `onPlan(plan)`
  - `onTask(task)` (start/update/done)
  - `onSummary(summary)`

---

## 5) ربط الـ State في `ChatPage.tsx`
- state جديد:
  - `researchClarify: { questions, messageId } | null`
  - `researchPlan: { goal, steps, messageId } | null`
  - `researchTasks: Map<messageId, Task[]>`
  - `researchSummary: Map<messageId, Summary>`
- الرسالة الـassistant الحالية تتلقى الـ render حسب الترتيب:
  1. ClarifyDialog (إن وُجد) → ينتظر إجابة المستخدم
  2. ResearchPlanCard
  3. ResearchTaskTimeline (live)
  4. ResearchSummaryCard
  5. DeepResearchCard (التقرير الكامل — موجود)

---

## 6) أمان وتكاليف
- Deep Research v2 يكلّف ~5-10x من رد عادي → نخصم credits أعلى (نُحدث `deduct-credits` لتقبل `action_type: "deep_research"`).
- Rate limit: max 1 deep-research نشط لكل مستخدم في وقت واحد.
- Timeout كلي: 90 ثانية (بدل 60 الحالي).

---

## ملفات سيتم إنشاؤها/تعديلها
**جديدة**:
- `src/components/research/ResearchTaskTimeline.tsx`
- `src/components/research/ResearchPlanCard.tsx`
- `src/components/research/ResearchSummaryCard.tsx`
- `src/components/research/ClarifyDialog.tsx`
- `src/components/research/DeepResearchToggle.tsx` (الزر فوق الـcomposer)

**تعديلات**:
- `src/pages/ChatPage.tsx` — state + render + DeepResearchToggle
- `src/components/ChatMessage.tsx` — render مكوّنات البحث في رسائل المساعد
- `src/lib/streamChat.ts` — callbacks جديدة
- `supabase/functions/chat/index.ts` — DeepResearchOrchestrator (مرحلة Classifier→Planner→Executor→Reflector→Synthesizer→Summarizer)

---

## ترتيب التنفيذ
1. مكوّنات الـ UI الأربعة + DeepResearchToggle (بدون منطق backend بعد — mock)
2. توسيع SSE events في `chat/index.ts` (plan/task/summary)
3. كتابة DeepResearchOrchestrator الكامل
4. ربط الـ state والـ events في ChatPage
5. اختبار end-to-end على سؤال معقد (مثل "قارن GPT-5 vs Claude 4 vs Gemini 3")
6. ضبط التكاليف والـ rate limits

---

## ملاحظة على المكتبة الـpaste
الكود اللي بعتّه (`@icons-pack/react-simple-icons` + `@/components/ai-elements/task` + `nanoid`) من Vercel AI Elements — هذه المكتبة غير مثبتة في المشروع وتحتاج تبعيات إضافية. **الحل**: نبني نسخة محلية بنفس الـ API والـ visual style باستخدام `lucide-react` (موجود) + `framer-motion` (موجود) + `crypto.randomUUID()` (بدون nanoid). نفس النتيجة البصرية بدون dependencies جديدة.
