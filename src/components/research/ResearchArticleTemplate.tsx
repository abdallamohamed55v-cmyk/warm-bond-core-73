import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen } from "lucide-react";
import { TemplateProps } from "./templateUtils";
import HeroImageGrid from "./HeroImageGrid";
import SourceCard from "./SourceCard";

const md = {
  h1: ({ node: _n, ...p }: any) => <h2 dir="auto" {...p} />,
  h2: ({ node: _n, ...p }: any) => (
    <h2
      dir="auto"
      className="mt-12 mb-4 font-display text-2xl font-bold text-foreground sm:text-3xl"
      {...p}
    />
  ),
  h3: ({ node: _n, ...p }: any) => (
    <h3 dir="auto" className="mt-8 mb-3 text-lg font-semibold text-foreground sm:text-xl" {...p} />
  ),
  p: ({ node: _n, ...p }: any) => (
    <p dir="auto" className="my-4 text-[15px] leading-[1.85] text-foreground/85 sm:text-base" {...p} />
  ),
  li: ({ node: _n, ...p }: any) => (
    <li dir="auto" className="my-1.5 text-[15px] leading-[1.8] text-foreground/85" {...p} />
  ),
  blockquote: ({ node: _n, ...p }: any) => (
    <blockquote
      dir="auto"
      className="my-6 border-s-2 border-primary/60 bg-primary/5 px-5 py-3 text-[15px] italic text-foreground/90"
      {...p}
    />
  ),
  table: ({ node: _n, ...p }: any) => (
    <div className="my-6 overflow-x-auto rounded-2xl border border-foreground/10">
      <table className="w-full text-sm" {...p} />
    </div>
  ),
  th: ({ node: _n, ...p }: any) => (
    <th dir="auto" className="bg-foreground/5 px-3 py-2 text-start font-semibold text-foreground" {...p} />
  ),
  td: ({ node: _n, ...p }: any) => (
    <td dir="auto" className="border-t border-foreground/10 px-3 py-2 text-foreground/85" {...p} />
  ),
  code: ({ inline, ...p }: any) =>
    inline ? (
      <code className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[0.85em] text-primary" {...p} />
    ) : (
      <code className="block overflow-x-auto rounded-2xl bg-foreground/5 p-4 font-mono text-xs" {...p} />
    ),
  img: () => null,
  a: ({ node: _n, ...p }: any) => (
    <a {...p} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline" />
  ),
};

const ResearchArticleTemplate = ({
  data, cleanReport, isRtl, sources, wordCount, readMins, reportEmpty,
}: TemplateProps) => {
  const [showSources, setShowSources] = useState(false);
  return (
    <div className="relative">
      {/* Ambient gradient background — landing-style */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>

      {/* HERO */}
      <section className="relative flex flex-col items-center overflow-hidden pt-14 pb-6 md:pt-20">
        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/80 sm:text-[11px]"
          >
            {isRtl ? "بحث معمّق" : "Deep Research"}
          </motion.div>

          <motion.h1
            dir="auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 font-display text-[8vw] font-bold uppercase leading-[1.05] tracking-tight text-foreground md:text-[5vw]"
          >
            {data.query}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground"
          >
            <span>
              {new Date().toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
            <span className="opacity-40">·</span>
            <span>{readMins} {isRtl ? "دقيقة قراءة" : "min read"}</span>
            <span className="opacity-40">·</span>
            <span>{wordCount.toLocaleString()} {isRtl ? "كلمة" : "words"}</span>
            {sources.length > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span>{sources.length} {isRtl ? "مصدر" : "sources"}</span>
              </>
            )}
          </motion.div>
        </div>

        {data.images.length > 0 && (
          <div className="mx-auto w-full max-w-[1200px]">
            <HeroImageGrid images={data.images} />
          </div>
        )}
      </section>

      {/* BODY */}
      <section className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {reportEmpty ? (
          <div className="rounded-2xl border border-foreground/10 bg-card/40 p-10 text-center text-sm text-muted-foreground">
            {isRtl ? "التقرير قيد التحضير. حاول مرة أخرى." : "Report is still being prepared."}
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            lang={isRtl ? "ar" : "en"}
            className={`research-report ${isRtl ? "research-report--rtl" : ""}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
              {cleanReport}
            </ReactMarkdown>
          </motion.article>
        )}
      </section>

      {/* GALLERY */}
      {data.images.length > 1 && (
        <section className="border-t border-foreground/10 py-10">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {isRtl ? "معرض الصور" : "Gallery"}
            </div>
            <div className="mt-5 -mx-5 overflow-x-auto px-5 pb-2 scrollbar-thin">
              <div className="flex gap-3" style={{ width: "max-content" }}>
                {data.images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="h-56 w-80 shrink-0 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 sm:h-64 sm:w-96"
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SOURCES — collapsible */}
      {sources.length > 0 && (
        <section className="border-t border-foreground/10 py-10">
          <div className="mx-auto max-w-6xl px-5">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-card/40 px-4 py-3.5 text-start transition hover:bg-card/70"
              aria-expanded={showSources}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {isRtl ? "المصادر" : "Sources"}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {sources.length} {isRtl ? (sources.length === 1 ? "مرجع" : "مرجعًا") : (sources.length === 1 ? "reference" : "references")}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${showSources ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {showSources && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sources.map((u, i) => (
                      <SourceCard key={u + i} url={u} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-foreground/10 py-16 text-center">
        <div className="mx-auto h-1 w-1 rounded-full bg-foreground/30" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {isRtl ? "نهاية التقرير" : "End of report"}
        </p>
      </section>
    </div>
  );
};

export default ResearchArticleTemplate;
