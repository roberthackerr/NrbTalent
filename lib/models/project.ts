// lib/models/team.ts (Mongoose version)
import mongoose, { type Document, Schema, Types } from "mongoose"

export interface ITeamMemberSkill {
  name: string
  category: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  yearsOfExperience: number
  featured: boolean
}

export interface ITeamMember {
  userId: Types.ObjectId
  role: string
  joinDate: Date
  isLead: boolean
  skills: ITeamMemberSkill[]
}

export interface ITeamCombinedSkill {
  name: string
  category: string
  levels: string[]
  totalYears: number
  memberCount: number
}

export interface ITeam extends Document {
  name: string
  tagline?: string
  description?: string
  
  members: ITeamMember[]
  maxMembers?: number
  
  skills: ITeamCombinedSkill[]
  specialties: string[]
  
  availability: "available" | "busy" | "full"
  hourlyRate?: number
  preferredProjectTypes: string[]
  
  completedProjects: number
  rating?: number
  totalEarnings: number
  
  preferences: {
    minBudget: number
    maxTeamSize: number
    workStyle: "sync" | "async" | "mixed"
    communicationTools: string[]
  }
  
  isPublic: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const TeamMemberSkillSchema = new Schema<ITeamMemberSkill>({
  name: { type: String, required: true },
  category: { type: String, default: "Other" },
  level: { 
    type: String, 
    enum: ["beginner", "intermediate", "advanced", "expert"], 
    default: "intermediate" 
  },
  yearsOfExperience: { type: Number, default: 1 },
  featured: { type: Boolean, default: false }
})

const TeamMemberSchema = new Schema<ITeamMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  joinDate: { type: Date, default: Date.now },
  isLead: { type: Boolean, default: false },
  skills: [TeamMemberSkillSchema]
})

const TeamCombinedSkillSchema = new Schema<ITeamCombinedSkill>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  levels: [{ type: String }],
  totalYears: { type: Number, default: 0 },
  memberCount: { type: Number, default: 0 }
})

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true, unique: true },
  tagline: String,
  description: String,
  
  members: [TeamMemberSchema],
  maxMembers: { type: Number, default: 5 },
  
  skills: [TeamCombinedSkillSchema],
  specialties: [{ type: String }],
  
  availability: { 
    type: String, 
    enum: ["available", "busy", "full"], 
    default: "available" 
  },
  hourlyRate: Number,
  preferredProjectTypes: [{ type: String }],
  
  completedProjects: { type: Number, default: 0 },
  rating: Number,
  totalEarnings: { type: Number, default: 0 },
  
  preferences: {
    minBudget: { type: Number, default: 1000 },
    maxTeamSize: { type: Number, default: 5 },
    workStyle: { 
      type: String, 
      enum: ["sync", "async", "mixed"], 
      default: "mixed" 
    },
    communicationTools: [{ type: String, default: ["chat", "video"] }]
  },
  
  isPublic: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Auto-update updatedAt
TeamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
})

// Calculate combined skills before save
TeamSchema.pre('save', function(next) {
  if (this.members && this.members.length > 0) {
    const skillMap = new Map<string, ITeamCombinedSkill>();
    
    this.members.forEach(member => {
      member.skills.forEach(skill => {
        const key = `${skill.name.toLowerCase()}-${skill.category.toLowerCase()}`;
        
        if (!skillMap.has(key)) {
          skillMap.set(key, {
            name: skill.name,
            category: skill.category,
            levels: [],
            totalYears: 0,
            memberCount: 0
          });
        }
        
        const combinedSkill = skillMap.get(key)!;
        combinedSkill.levels.push(skill.level);
        combinedSkill.totalYears += skill.yearsOfExperience || 0;
        combinedSkill.memberCount++;
      });
    });
    
    this.skills = Array.from(skillMap.values());
  }
  next();
})

export default mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema)