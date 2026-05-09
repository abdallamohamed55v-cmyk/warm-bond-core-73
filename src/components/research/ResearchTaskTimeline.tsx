import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, FileText, Globe, Brain, CheckCircle2, Loader2, AlertCircle, BookOpen, MessageSquare, Image as ImageIcon } from "lucide-react";

export type ResearchTask = {
  id: string;
  kind: "search" | "read" | "analyze" | "wiki" | "academic" | "social" | "synthesize" | "image" | string;
  label: string;
  target?: string;
  status: "running" | "done" | "error";
  summary?: string;
  domains?: string[];
  image?: { url: string; caption?: string };
  bullets?: string[];
};

const iconForKind = (kind: string) => {
  switch (kind) {
    case "search": return Search;
    case "read": return FileText;
    case "analyze": return Brain;
    case "wiki": return BookOpen;
    case "academic": return BookOpen;
    case "social": return MessageSquare;
    case "synthesize": return Brain;
    case "image": return ImageIcon;
    default: return Globe;
  }
};

interface Props {
  tasks: ResearchTask[];
  isActive: boolean;
}

const ResearchTaskTimeline = ({ tasks, isActive }: Props) => {
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const sources = new Set<string>();
    tasks.forEach((t) => {
      if (t.target) sources.add(t.target);
      t.domains?.forEach((d) => sources.add(d));
    });
    return { sources: sources.size, total: tasks.length };
  }, [tasks]);

  if (tasks.length === 0 && !isActive) return null;

  let lastRunning: ResearchTask | undefined;
  for (let i = tasks.length - 1; i >= 0; i--) { if (tasks[i].status === "running") { lastRunning = tasks[i]; break; } }
  const headline = isActive
    ? (lastRunning?.label || "Chain of Thought")
    : "Chain of Thought";

  return (
    <div className="mb-3 rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent/30 transition-colors"
      >
        {isActive ? (
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
        ) : (
          <Brain className="w-4 h-4 text-violet-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground/90 flex-1 text-left truncate">{headline}</span>
        {!isActive && tasks.length > 0 && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
        )}
        <span className="text-xs text-muted-foreground shrink-0">{stats.total}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="px-3 pb-3 space-y-2 max-h-[420px] overflow-y-auto">
              {tasks.map((t) => {
                const Icon = iconForKind(t.kind);
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">
                        {t.status === "running" ? (
                          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                        ) : t.status === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </span>
                      <span className="text-foreground/85 flex-1 break-words leading-relaxed">
                        {t.label}
                        {t.target && t.kind !== "image" && (
                          <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-border/40 bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {t.target.length > 40 ? t.target.slice(0, 40) + "…" : t.target}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Domain chips */}
                    {t.domains && t.domains.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 ml-5 flex flex-wrap gap-1.5"
                      >
                        {t.domains.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] text-foreground/75 border border-border/30"
                          >
                            {d}
                          </span>
                        ))}
                      </motion.div>
                    )}

                    {/* Image preview card */}
                    {t.image?.url && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 ml-5 rounded-xl border border-border/40 bg-background/60 p-3 flex flex-col items-center"
                      >
                        <img
                          src={t.image.url}
                          alt={t.image.caption || "Found image"}
                          className="rounded-lg max-h-44 object-contain"
                          loading="lazy"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                        {t.image.caption && (
                          <p className="mt-2 text-[11px] text-muted-foreground text-center leading-relaxed">
                            {t.image.caption}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Bullet findings */}
                    {t.bullets && t.bullets.length > 0 && (
                      <ul className="mt-1.5 ml-5 space-y-1">
                        {t.bullets.map((b, idx) => (
                          <li key={idx} className="text-[11.5px] text-foreground/75 leading-relaxed flex gap-1.5">
                            <span className="text-muted-foreground">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResearchTaskTimeline;
