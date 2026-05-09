import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Skill {
  id: string;
  user_id?: string | null;
  name: string;
  description: string;
  instructions: string;
  enabled_tools: string[];
  preferred_model: string | null;
  icon: string | null;
  is_active?: boolean;
  source?: "mine" | "system";
}

const ACTIVE_KEY = "megsy_active_skill_v1";

export function useActiveSkill() {
  const [activeSkill, setActiveSkillState] = useState<Skill | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setActiveSkill = useCallback((skill: Skill | null) => {
    setActiveSkillState(skill);
    try {
      if (skill) localStorage.setItem(ACTIVE_KEY, JSON.stringify(skill));
      else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* ignore */ }
  }, []);

  return { activeSkill, setActiveSkill };
}

export function useSkills() {
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [librarySkills, setLibrarySkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [mine, lib] = await Promise.all([
      supabase.from("skills").select("*").order("created_at", { ascending: false }),
      supabase.from("system_skills").select("*").eq("is_active", true).order("display_order"),
    ]);
    setMySkills(((mine.data as any[]) || []).map((s) => ({ ...s, source: "mine" as const })));
    setLibrarySkills(((lib.data as any[]) || []).map((s) => ({ ...s, source: "system" as const })));
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { mySkills, librarySkills, loading, reload };
}
