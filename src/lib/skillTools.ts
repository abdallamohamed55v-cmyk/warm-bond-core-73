// Catalog of tool names that a Skill can enable. Names match the tool names
// used by the chat edge function.
export interface SkillToolOption {
  name: string;
  label: string;
  description: string;
}

export const SKILL_TOOLS: SkillToolOption[] = [
  { name: "WEB_SEARCH", label: "بحث الويب", description: "البحث في الإنترنت عن معلومات حديثة" },
  { name: "FETCH_URL", label: "قراءة رابط", description: "فتح صفحة محددة وقراءة محتواها" },
  { name: "BROWSE_WEBSITE", label: "تصفّح موقع", description: "فتح متصفّح حقيقي لإكمال مهام تفاعلية" },
  { name: "GENERATE_IMAGE", label: "توليد صور", description: "إنشاء صور من نص" },
  { name: "GENERATE_VIDEO", label: "توليد فيديو", description: "إنشاء فيديو من نص" },
  { name: "GENERATE_VOICE", label: "توليد صوت (TTS)", description: "تحويل النص إلى كلام" },
  { name: "CODE_INTERPRETER", label: "مفسّر الكود", description: "تنفيذ JS لحسابات وتحويلات" },
  { name: "SEARCH_ATTACHMENTS", label: "بحث في مرفقاتك", description: "بحث دلالي داخل ملفاتك المرفوعة" },
  { name: "REMEMBER_FACT", label: "حفظ في الذاكرة", description: "تذكّر معلومات مهمة طويلة الأمد" },
  { name: "SHOPPING_SEARCH", label: "بحث منتجات", description: "البحث عن منتجات في المتاجر" },
  { name: "CANVA_CREATE_SLIDES", label: "إنشاء عروض Canva", description: "توليد سلايدز عبر Canva" },
];

export const SKILL_MODELS: { id: string; label: string }[] = [
  { id: "auto", label: "تلقائي" },
  { id: "google/gemini-2.5-flash-lite-preview-09-2025", label: "Gemini 2.5 Flash Lite" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "moonshotai/kimi-k2.5:nitro", label: "Kimi K2.5 Nitro" },
];
