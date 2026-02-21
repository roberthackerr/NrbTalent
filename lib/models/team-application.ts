// lib/models/team-application.ts
import { ObjectId } from "mongodb";

export interface TeamApplication {
  _id?: ObjectId;
  projectId: ObjectId;
  teamId: ObjectId;
  teamName: string;
  clientId: ObjectId;
  
  // Proposal
  coverLetter: string;
  proposedBudget: number;
  estimatedTimeline: string; // "2 weeks", "1 month"
  teamMembers: Array<{
    userId: ObjectId;
    name: string;
    role: string;
    skills: string[];
  }>;
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  clientViewed: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}