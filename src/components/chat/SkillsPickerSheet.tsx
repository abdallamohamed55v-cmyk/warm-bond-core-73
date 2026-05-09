import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Settings2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSkills, type Skill } from "@/hooks/useSkills";

interface Props {
  open: boolean;
  onClose: () => void;
  activeSkill: Skill | null;
  onSelect: (skill: Skill | null) => void;
}

export default function SkillsPickerSheet({ open, onClose, activeSkill, onSelect }: Props) {
  const navigate = useNavigate();
  const { mySkills, librarySkills, loading } = useSkills();
  const all: Skill[] = [...mySkills, ...librarySkills.filter((l) => !mySkills.some((m) => m.name === l.name))];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-foreground/15 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[61] liquid-glass-milk rounded-t-3xl overflow-hidden pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-foreground/30" />
            </div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between">
              <h3 className="text-[17px] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> المهارات
              </h3>
              <button
                onClick={() => { onClose(); navigate("/settings/skills"); }}
                className="text-xs text-primary flex items-center gap-1 hover:opacity-80"
              >
                <Settings2 className="w-3.5 h-3.5" /> إدارة
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <button
                onClick={() => { onSelect(null); onClose(); }}
                className={`w-full text-right flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 transition-colors ${!activeSkill ? "bg-primary/15 border border-primary/30" : "hover:bg-accent/40"}`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[14px] font-semibold">تلقائي</div>
                  <div className="text-[11px] text-muted-foreground">يقرر الذكاء الاصطناعي بنفسه أنسب مهارة</div>
                </div>
                {!activeSkill && <Check className="w-4 h-4 text-primary" />}
              </button>

              {loading ? (
                <div className="text-center text-xs text-muted-foreground py-6">جارٍ التحميل…</div>
              ) : all.length === 0 ? (
                <button
                  onClick={() => { onClose(); navigate("/settings/skills"); }}
                  className="w-full flex items-center justify-center gap-2 py-6 text-sm text-primary border border-dashed border-primary/30 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> أضف مهارة جديدة
                </button>
              ) : (
                all.map((skill) => {
                  const isActive = activeSkill?.id === skill.id || activeSkill?.name === skill.name;
                  return (
                    <button
                      key={`${skill.source}-${skill.id}`}
                      onClick={() => { onSelect(skill); onClose(); }}
                      className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${isActive ? "bg-primary/15 border border-primary/30" : "hover:bg-accent/40"}`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-secondary/70 flex items-center justify-center text-foreground/85">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-right min-w-0">
                        <div className="text-[14px] font-medium flex items-center gap-2 justify-start">
                          <span className="truncate">{skill.name}</span>
                          {skill.source === "system" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">جاهزة</span>
                          )}
                        </div>
                        {skill.description && (
                          <div className="text-[11px] text-muted-foreground truncate">{skill.description}</div>
                        )}
                      </div>
                      {isActive && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
