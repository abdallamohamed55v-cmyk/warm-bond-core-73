
# خطة: قالب الديب رسيرش الجديد + ستريمينج حي

## 1) القالب الثابت لصفحة عرض البحث (`/research/preview/:id`)

نحذف نظام الثلاث قوالب العشوائية (Editorial / Magazine / Journal) ونستبدله بقالب واحد ثابت مستوحى من Landing Page (نفس روح HeroSection: عناوين كبيرة، حركات framer-motion، شبكة فيديوهات/صور مائلة، تباين قوي).

### الهيكل من أعلى لأسفل

```
┌──────────────────────────────────────────────┐
│  [شريط تقدم القراءة - 2px في الأعلى]          │
│  Header شفاف: ← رجوع   مشاركة   تحميل PDF    │
├──────────────────────────────────────────────┤
│  HERO                                        │
│   • Kicker: "DEEP RESEARCH"                  │
│   • H1 ضخم بخط display نفس الـ landing       │
│     (تأثير fade-in + y)                      │
│   • Meta سطر واحد: التاريخ • دقائق القراءة   │
│     • عدد المصادر • عدد الكلمات              │
│   • شبكة 5 صور مائلة (مثل heroVideos)        │
│     مع rotate -6/-3/0/+3/+6                  │
├──────────────────────────────────────────────┤
│  ملخص تنفيذي بكارت زجاجي (glass) كبير         │
│  ضمن max-w 4xl، خط Inter/Cairo               │
├──────────────────────────────────────────────┤
│  جسم التقرير (ReactMarkdown)                  │
│   • drop-cap للحرف الأول                     │
│   • H2 بخط display مع خط سفلي ملون            │
│   • Pull-quotes للـ blockquote                │
│   • جداول بإطار محسّن وألوان tokens           │
│   • inline `code` ببادج ملون                  │
│   • صورة inline تلقائيًا كل ~3 فقرات بحجم     │
│     full-bleed مع caption من image_query     │
├──────────────────────────────────────────────┤
│  معرض الصور — Parallax Marquee أفقي         │
│  (يستلهم HorizontalGallery)                  │
├──────────────────────────────────────────────┤
│  المصادر — شبكة كروت 2-3 أعمدة                │
│   كل كرت: favicon كبير + عنوان الموقع +       │
│   snippet + رقم + رابط خارجي                  │
├──────────────────────────────────────────────┤
│  CTA ختامي: "ابحث في موضوع آخر" + زر         │
└──────────────────────────────────────────────┘
```

### قرارات التصميم
- استخدام الـ tokens من `src/index.css` فقط (لا ألوان مباشرة)
- نفس font-display وfont-display sizing من `HeroSection`
- دعم RTL/LTR تلقائي بنفس منطق الموجود
- متجاوب: على الموبايل (390px الحالي) شبكة الـ hero تتحول لـ 3 صور فقط، المصادر عمود واحد
- كل القوالب القديمة (`EditorialTemplate`, `MagazineTemplate`, `JournalTemplate`, `templateUtils.pickTemplateFromSeed`) تُحذف

---

## 2) ستريمينج حي يعرض ما يحدث (يقتل الملل)

المشكلة الحالية: يوجد `setInterval` كل 2.2s يدور على 5 جمل ثابتة قبل وصول أي محتوى → يبدو مزيفًا.

### الحل: Live Activity Feed

```
   ✶ التخطيط للبحث              ← قائمة بـ 5-7 أسئلة فرعية
   ✓ بحث: "ما هي…"              ← يظهر سطرًا سطرًا
   ✓ بحث: "كيف يعمل…"
   ↻ قراءة: techcrunch.com      ← مع favicon حقيقي
   ↻ قراءة: wikipedia.org/…
   ✶ جمع 12 مصورة                ← thumbnails صغيرة تظهر فور وصولها
   ✶ كتابة التقرير              ← شريط تقدم مبني على عدد الكلمات
        ▓▓▓▓▓▓▓░░░  1,240 / ~2,500 كلمة
```

### عناصر الـ feed
1. **Plan chips**: عند `event:plan` نعرض الأسئلة كـ chips متحركة بـ stagger
2. **Search rows**: لكل `event:search_query` صف جديد بـ slide-in من اليسار، مع badge "بحث"
3. **Source rows**: عند وصول مصدر، favicon من `s2/favicons` + hostname + استخراج العنوان لو متاح
4. **Image strip**: شريط صور صغيرة 60×60 يمتلئ تدريجيًا (مع shimmer للقادم)
5. **Word counter**: عند بدء `onDelta` نحسب الكلمات live ونعرض شريط تقدم تقديري
6. **Elapsed timer**: ساعة "00:42" تعمل من بداية الطلب

### تغييرات الكود
- استبدال `buildStatusFromQuery` + `phaseTimer` المزيف بـ component جديد `LiveResearchActivity.tsx`
- يقرأ نفس الأحداث الحالية (`onStatus`, `onEvent`, `onImages`, `onDelta`) لكن يعرضها بصريًا أغنى
- إضافة استخراج المصادر من `event:source` لو الـ backend يبعثها — لو لا، نستخرج URLs من `onStatus` نصوص
- على الموبايل: نفس الـ feed لكن مضغوط (favicon + hostname فقط)

### تحسين اختياري للـ backend
لو بدك تجربة أفضل، نضيف لاحقًا في `supabase/functions/chat/index.ts` بث events أكثر تفصيلاً:
- `event: "source"` مع `{ url, title }` لكل صفحة مفتوحة
- `event: "image_found"` لكل صورة مع `{ url, alt }`
هذا اختياري ولا يدخل في هذه الجولة.

---

## 3) تقييم مكتبتَي deer-flow و BettaFish

كلاهما **مشاريع Python كاملة (FastAPI/LangGraph)** للديب رسيرش. لا يمكن استخدامهما "كمكتبة" داخل Supabase Edge Functions (Deno) أو في الفرونت.

| المشروع | اللغة | الهدف | هل يصلح هنا؟ |
|---|---|---|---|
| `bytedance/deer-flow` | Python + LangGraph | Multi-agent research مع planner/researcher/coder/reporter | ❌ كخدمة، ✅ كإلهام معماري |
| `666ghj/BettaFish` | Python + Vue | Deep search مع UI | ❌ نفس السبب |

**التوصية:** لا ندمجهما مباشرة، لكن نستلهم منهما **معمارية الـ multi-step**:
- Planner ينتج خطة → عدة Researchers يبحثون بالتوازي → Reporter يكتب
- هذا قابل للتطبيق في `chat/index.ts` بدون مكتبة خارجية، بنفس streamChat الموجود
- لو لاحقًا أردت deer-flow فعليًا → يحتاج خادم Python منفصل (Railway/Fly) ونناديه عبر HTTP، وهي مهمة كبيرة منفصلة

أقترح **تأجيل** هذا التحسين لجولة قادمة بعد إنجاز القالب + الـ live feed، ونناقش حينها هل نبني planner/researcher داخل Edge Function أم نستضيف deer-flow.

---

## 4) تنظيف عابر
- حذف `src/integrations/supabase/auth-middleware.ts` (متبقٍ من قالب TanStack ويسبب TS2307 الآن)

---

## ملفات ستتغير

**جديدة:**
- `src/components/research/ResearchArticleTemplate.tsx` (القالب الموحّد)
- `src/components/research/LiveResearchActivity.tsx` (الـ feed الحي)
- `src/components/research/SourceCard.tsx`
- `src/components/research/HeroImageGrid.tsx`

**معدّلة:**
- `src/pages/ResearchPreviewPage.tsx` — يستخدم القالب الواحد فقط
- `src/pages/DeepResearchPage.tsx` — يستبدل phaseTimer بـ LiveResearchActivity
- `src/components/files/ResearchFlow.tsx` — يُحذف أو يُعاد توجيهه
- `src/components/research/templateUtils.tsx` — يُبسَّط (نُبقي helpers مفيدة فقط)

**محذوفة:**
- `src/components/research/templates/EditorialTemplate.tsx`
- `src/components/research/templates/MagazineTemplate.tsx`
- `src/components/research/templates/JournalTemplate.tsx`
- `src/integrations/supabase/auth-middleware.ts`

---

## أسئلة قبل التنفيذ

1. هل توافق على **حذف** القوالب الثلاث القديمة نهائيًا، أم تفضّل إبقاءها كخيار "كلاسيكي" مع جعل القالب الجديد افتراضيًا؟
2. شبكة الـ Hero: 5 صور مائلة من صور التقرير نفسه (مثل landing) أم صورة hero واحدة كبيرة + شريط ثانوي؟
3. الـ Live Feed: نعرضه inline داخل المحادثة (مكان `ResearchFlow` الحالي) أم في sidebar/panel جانبي يمكن طيّه؟
4. deer-flow / BettaFish: نؤجلهما الآن ونركّز على القالب + الستريمينج، أم تريد خطة منفصلة لاستضافة deer-flow كخادم Python؟
