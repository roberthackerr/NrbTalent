// lib/models/team.ts
import type { ObjectId } from "mongodb";

export interface TeamMemberSkill {
  name: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  featured: boolean;
}

export interface TeamMember {
  joinRequestId?:any;
  requestId?:any;
  joinMethod?:any;
  userId: ObjectId;
  role: string; // "designer", "developer", "lead", "marketer"
  joinDate: Date;
  isLead: boolean;
  skills: TeamMemberSkill[]; // ← Use the SAME skill structure
}

export interface Team {
  _id?: ObjectId;
  name: string;
  tagline?: string;
  description?: string;
  
  // Members
  members: TeamMember[];
  maxMembers?: number;
  
  // Combined skills for quick searching
  skills: {
    name: string;
    category: string;
    levels: string[]; // ["expert", "intermediate"] - levels from all members
    totalYears: number;
    memberCount: number;
  }[];
  
  // Stats
  completedProjects: number;
  rating?: number;
  totalEarnings: number;
  availability: "available" | "busy" | "full";
  
  createdAt: Date;
  updatedAt: Date;
}