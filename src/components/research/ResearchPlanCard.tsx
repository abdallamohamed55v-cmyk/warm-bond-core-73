import { motion } from "framer-motion";
import { Target, ListChecks } from "lucide-react";

export type ResearchPlan = {
  goal: string;
  steps: string[];
};

const ResearchPlanCard = ({ plan }: { plan: ResearchPlan }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
          <ListChecks className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Research Plan</h3>
      </div>
      <div className="flex items-start gap-2 mb-3 text-xs text-muted-foreground">
        <Target className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-400/70" />
        <p className="leading-relaxed">{plan.goal}</p>
      </div>
      <ol className="space-y-1.5">
        {plan.steps.map((step, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-2 text-xs text-foreground/85"
          >
            <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/15 text-violet-300 flex items-center justify-center text-[10px] font-semibold">
              {i + 1}
            </span>
            <span className="leading-relaxed pt-0.5">{step}</span>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
};

export default ResearchPlanCard;
