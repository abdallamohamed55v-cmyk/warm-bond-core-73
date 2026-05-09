import { motion, AnimatePresence, type Variants } from "framer-motion";

type Props = {
  text: string;
  highlight: string;
  highlightColor: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
};

const letter = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 380, damping: 26 } },
  exit: { opacity: 0, y: -10, filter: "blur(8px)", transition: { duration: 0.18 } },
};

function RevealText({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span variants={container} initial="hidden" animate="show" exit="exit" className={`inline-flex ${className || ""}`}>
      {text.split("").map((ch, i) => (
        <motion.span key={`${ch}-${i}`} variants={letter} className="inline-block whitespace-pre">
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function AnimatedHeadline({ text, highlight, highlightColor }: Props) {
  const key = `${text}|${highlight}`;
  return (
    <AnimatePresence mode="wait">
      <motion.h1
        key={key}
        className="relative text-[28px] md:text-[36px] leading-none tracking-tight font-extrabold text-foreground flex items-baseline gap-2"
      >
        <RevealText text={text + " "} />
        <RevealText text={highlight} className="font-extrabold" />
        <style>{`.dia-hl-${highlightColor.replace('#','')} { color: ${highlightColor}; }`}</style>
      </motion.h1>
    </AnimatePresence>
  );
}
