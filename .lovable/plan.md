## ايه الموجود حالياً في الشات الجماعي

- ✅ Realtime للرسائل الجديدة عبر `postgres_changes` على `messages`
- ✅ Realtime لانضمام/خروج الأعضاء على `conversation_members`
- ✅ مؤشر "فلان بيكتب…" (typing indicator) مع نقط متحركة
- ✅ broadcast لـ `ai_busy` لما حد بيشغّل الـ AI
- ✅ ThinkingLoader و streaming للرد
- ✅ ألوان مميزة لكل عضو + اسم وصورة فوق الفقاعة
- ✅ Bump للمحادثة لأعلى القائمة عند القبول

## اللي ناقص ومقترح إضافته

### 1) مؤشر الحضور Online/Offline (Presence)

- استخدام `presence` channel الموجود لكن مع `track()` بدل broadcast بس
- نقطة خضراء على الـ avatar في شريط الأعضاء لو online
- "آخر ظهور" للـ offline

### 2) إيصال القراءة (Read receipts)

- جدول جديد `message_reads (message_id, user_id, read_at)` + RLS
- أيقونات صح/صحين تحت رسالة المستخدم نفسه (زي واتساب)
- تجمع avatars الصغيرة لمن قرأ الرسالة

### 3) أنيميشن دخول الرسالة

- `motion.div` على كل ChatMessage مع `initial/animate` (slide + fade) — حالياً الرسائل بتظهر فجأة
- أنيميشن مختلف للرسائل الجاية (يمين) عن الراجعة (شمال)

### 4) إشعار "انضم/غادر فلان للمحادثة"

- system message بسيط في وسط الشات لما `conversation_members` يتغير
- بدون حفظ في DB (محلي فقط) أو جدول `conversation_events`

### 5) قفل الـ AI لما حد تاني بيستخدمه

- موجود `remoteAiBusy` بس مش شايفه مستخدم في UI
- إضافة بانر متحرك فوق الـ input: "Megsy رد على فلان… استنى لحظة" مع شيمر
- تعطيل زر الإرسال في الوقت ده

### 6) صوت/اهتزاز للرسالة الجديدة

- صوت خفيف (notification.mp3) لما تيجي رسالة من عضو تاني والصفحة مش focused
- `document.title` يتغير لـ "(1) Megsy" لما يكون فيه unread

### 7) Typing لكل عضو على حدة بصورته

- حالياً بيظهر اسم بس — نخلي avatar صغير مع النقط المتحركة لكل واحد بيكتب

### 8) Skeleton loading للمحادثة

- لما تفتح conversation وبتحمّل الرسائل، يظهر 3-4 skeleton bubbles بدل شاشة فاضية

### 9) Reactions 

- جدول `message_reactions` + emoji picker على long-press للرسالة
- realtime sync

### 10) Mentions @user

- عند الكتابة @ يظهر dropdown بأعضاء المحادثة
- highlight الـ mention في الرسالة
- إشعار خاص للـ mentioned user

### 11) Scroll smooth + auto-scroll ذكي

- لو المستخدم scroll لأعلى يدوياً، ميتسحبش لتحت تلقائياً عند رسالة جديدة (موجود جزئياً)
- بدل كده يظهر badge "رسالة جديدة ↓"

## ترتيب الأولويات المقترح

1. **عاجل (UX أساسي):** أنيميشن دخول الرسائل (#3) + بانر AI busy واضح (#5) + Skeleton (#8)
2. **مهم لتجربة الجروب:** Read receipts (#2) + Online presence (#1) + System messages للانضمام (#4)
3. **تحسينات:** Mentions (#10) + Reactions (#9) + صوت (#6) + Typing بالـ avatars (#7)

---

**سؤال قبل ما أبدأ:** عايز أبدأ بأي مجموعة من دول؟ ولا تحب أعمل المرحلة الأولى كلها (1-3-5-8) دفعة واحدة؟