// lib/utils/team-skills.ts
export function combineMemberSkills(members: any[]): string[] {
  const uniqueSkills = new Set<string>();
  
  members.forEach(member => {
    member.skills?.forEach((skill: any) => {
      if (skill.name) {
        uniqueSkills.add(skill.name);
      }
    });
  });
  
  return Array.from(uniqueSkills);
}

export function calculateTeamSkillCoverage(teamSkills: any[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100;
  
  const teamSkillNames = teamSkills.map(s => s.name.toLowerCase());
  const matchedSkills = requiredSkills.filter(reqSkill => 
    teamSkillNames.some(teamSkill => 
      teamSkill.includes(reqSkill.toLowerCase()) || 
      reqSkill.toLowerCase().includes(teamSkill)
    )
  );
  
  return (matchedSkills.length / requiredSkills.length) * 100;
}

export function findSkillGaps(teamSkills: any[], requiredSkills: string[]): string[] {
  const teamSkillNames = teamSkills.map(s => s.name.toLowerCase());
  return requiredSkills.filter(reqSkill => 
    !teamSkillNames.some(teamSkill => 
      teamSkill.includes(reqSkill.toLowerCase()) || 
      reqSkill.toLowerCase().includes(teamSkill)
    )
  );
}