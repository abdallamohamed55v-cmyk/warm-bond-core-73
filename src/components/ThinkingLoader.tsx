import { memo, useEffect, useRef, useState } from "react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";

interface ThinkingLoaderProps {
  searchStatus?: string;
}

const ThinkingLoader = ({ searchStatus }: ThinkingLoaderProps) => {
  const [steps, setSteps] = useState<string[]>([]);
  const lastRef = useRef<string>("");

  useEffect(() => {
    const s = (searchStatus || "").trim();
    if (!s || s === lastRef.current) return;
    lastRef.current = s;
    setSteps((prev) => (prev[prev.length - 1] === s ? prev : [...prev, s]));
  }, [searchStatus]);

  const content = steps.length > 0
    ? steps.map((s) => `- ${s}`).join("\n")
    : "Working through your request…";

  return (
    <div className="py-2">
      <Reasoning isStreaming defaultOpen>
        <ReasoningTrigger />
        <ReasoningContent>{content}</ReasoningContent>
      </Reasoning>
    </div>
  );
};

export default memo(ThinkingLoader);
