// lib/utils/skills.ts
export const getSkillName = (skill: any): string => {
  if (!skill) return '';
  if (typeof skill === 'string') return skill;
  if (skill.name) return skill.name;
  if (skill.skill) return skill.skill;
  return '';
};

export const normalizeSkills = (skills: any[]): string[] => {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(skill => getSkillName(skill));
};