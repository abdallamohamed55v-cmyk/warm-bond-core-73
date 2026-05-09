import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Sparkles, Library, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSkills, type Skill } from "@/hooks/useSkills";
import { SKILL_TOOLS, SKILL_MODELS } from "@/lib/skillTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type DraftSkill = Partial<Skill> & { name: string; instructions: string; enabled_tools: string[] };

const emptyDraft = (): DraftSkill => ({
  name: "",
  description: "",
  instructions: "",
  enabled_tools: [],
  preferred_model: null,
  icon: null,
});

export default function SkillsSettingsPage() {
  const navigate = useNavigate();
  const { mySkills, librarySkills, loading, reload } = useSkills();
  const [tab, setTab] = useState<"mine" | "library">("mine");
  const [editing, setEditing] = useState<DraftSkill | null>(null);
  const [saving, setSaving] = useState(false);

  const startNew = () => setEditing(emptyDraft());
  const startEdit = (s: Skill) => setEditing({ ...s });

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("الاسم مطلوب"); return; }
    if (!editing.instructions.trim()) { toast.error("التعليمات مطلوبة"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); toast.error("يجب تسجيل الدخول"); return; }

    const payload = {
      user_id: user.id,
      name: editing.name.trim(),
      description: editing.description?.trim() || "",
      instructions: editing.instructions.trim(),
      enabled_tools: editing.enabled_tools || [],
      preferred_model: editing.preferred_model && editing.preferred_model !== "auto" ? editing.preferred_model : null,
      icon: editing.icon || null,
    };

    const res = editing.id
      ? await supabase.from("skills").update(payload).eq("id", editing.id)
      : await supabase.from("skills").insert(payload);

    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing.id ? "تم التحديث" : "تمت الإضافة");
    setEditing(null);
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المهارة؟")) return;
    const { error } = await supabase.from("skills").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    reload();
  };

  const handleAddFromLibrary = async (s: Skill) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("يجب تسجيل الدخول"); return; }
    const { error } = await supabase.from("skills").insert({
      user_id: user.id,
      name: s.name,
      description: s.description,
      instructions: s.instructions,
      enabled_tools: s.enabled_tools || [],
      preferred_model: s.preferred_model,
      icon: s.icon,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`أُضيفت "${s.name}" إلى مهاراتك`);
    setTab("mine");
    reload();
  };

  const toggleTool = (name: string) => {
    if (!editing) return;
    const has = editing.enabled_tools.includes(name);
    setEditing({
      ...editing,
      enabled_tools: has ? editing.enabled_tools.filter((t) => t !== name) : [...editing.enabled_tools, name],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-accent/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> المهارات
          </h1>
          <div className="ms-auto">
            {!editing && tab === "mine" && (
              <Button size="sm" onClick={startNew} className="gap-1.5">
                <Plus className="w-4 h-4" /> جديدة
              </Button>
            )}
          </div>
        </div>

        {!editing && (
          <div className="max-w-3xl mx-auto px-4 pb-2 flex gap-1">
            {[
              { id: "mine" as const, label: "مهاراتي", icon: Sparkles },
              { id: "library" as const, label: "المكتبة", icon: Library },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50"}`}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{editing.id ? "تعديل مهارة" : "مهارة جديدة"}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-accent/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>الاسم *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="مثلاً: مبرمج Python" />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف القصير</Label>
              <Input value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="جملة واحدة تختصر دور المهارة" />
            </div>

            <div className="space-y-1.5">
              <Label>التعليمات *</Label>
              <Textarea
                rows={6}
                value={editing.instructions}
                onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
                placeholder="اشرح للذكاء الاصطناعي شخصيته، أسلوبه، والقواعد التي يلتزم بها عند تفعيل هذه المهارة…"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الأدوات المفعّلة</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {SKILL_TOOLS.map((tool) => {
                  const active = editing.enabled_tools.includes(tool.name);
                  return (
                    <button
                      key={tool.name}
                      onClick={() => toggleTool(tool.name)}
                      className={`text-right p-2.5 rounded-lg border transition-colors ${active ? "bg-primary/10 border-primary/40" : "border-border/40 hover:bg-accent/30"}`}
                    >
                      <div className="text-[13px] font-medium">{tool.label}</div>
                      <div className="text-[10.5px] text-muted-foreground">{tool.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الموديل المفضّل</Label>
              <select
                value={editing.preferred_model || "auto"}
                onChange={(e) => setEditing({ ...editing, preferred_model: e.target.value })}
                className="w-full h-10 rounded-lg border border-border/40 bg-background px-3 text-sm"
              >
                {SKILL_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5 flex-1">
                <Save className="w-4 h-4" /> {saving ? "جارٍ الحفظ…" : "حفظ"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center text-sm text-muted-foreground py-10">جارٍ التحميل…</div>
        ) : tab === "mine" ? (
          mySkills.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">لا توجد مهارات بعد. أنشئ واحدة أو أضف من المكتبة.</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button onClick={startNew} className="gap-1.5"><Plus className="w-4 h-4" /> جديدة</Button>
                <Button variant="outline" onClick={() => setTab("library")} className="gap-1.5"><Library className="w-4 h-4" /> المكتبة</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mySkills.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-border/40 bg-card flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">{s.name}</div>
                    {s.description && <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{s.description}</div>}
                    {s.enabled_tools?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.enabled_tools.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-accent/50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {librarySkills.map((s) => {
              const exists = mySkills.some((m) => m.name === s.name);
              return (
                <div key={s.id} className="p-3.5 rounded-xl border border-border/40 bg-card flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">{s.name}</div>
                    {s.description && <div className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{s.description}</div>}
                  </div>
                  <Button
                    size="sm"
                    variant={exists ? "outline" : "default"}
                    disabled={exists}
                    onClick={() => handleAddFromLibrary(s)}
                    className="gap-1 shrink-0"
                  >
                    {exists ? "مُضافة" : (<><Plus className="w-3.5 h-3.5" /> أضف</>)}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
