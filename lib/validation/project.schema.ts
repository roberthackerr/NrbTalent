// lib/validation/project.schema.ts
import { z } from "zod"

export const CurrencySchema = z.enum(["USD", "EUR", "MGA", "GBP"])

export const BudgetSchema = z.object({
  min: z.number().min(0).max(1000000),
  max: z.number().min(0).max(1000000),
  type: z.enum(["fixed", "hourly"]),
  currency: CurrencySchema.default("USD"),
  originalCurrency: CurrencySchema.optional(),
  exchangeRate: z.number().optional()
})

export const LocationSchema = z.object({
  remote: z.boolean().default(true),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional()
}).optional().default({ remote: true })

export const TimelineSchema = z.object({
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format"
  }),
  estimatedDuration: z.number().optional(),
  complexity: z.enum(["beginner", "intermediate", "expert"]).optional()
})

export const LocalizedFieldSchema = z.object({
  fr: z.string().optional(),
  en: z.string().optional(),
  es: z.string().optional(),
  mg: z.string().optional()
}).refine(data => {
  // Au moins une langue doit être présente
  return Object.values(data).some(v => v && v.length > 0)
}, { message: "At least one language is required" })

export const CreateProjectSchema = z.object({
  localized: z.object({
    title: LocalizedFieldSchema,
    description: LocalizedFieldSchema,
    summary: LocalizedFieldSchema.optional()
  }),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  skills: z.array(z.string()).min(1).max(20),
  budget: BudgetSchema,
  deadline: z.string(),
  location: LocationSchema,
  visibility: z.enum(["public", "private"]).optional().default("public"),
  tags: z.array(z.string()).optional().default([]),
  estimatedDuration: z.number().optional(),
  complexity: z.enum(["beginner", "intermediate", "expert"]).optional()
})

export const GetProjectsQuerySchema = z.object({
  page: z.string().optional().transform(val => Math.max(1, parseInt(val || "1"))),
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || "12")
    return Math.min(100, Math.max(1, num))
  }),
  category: z.string().optional().transform(val => val === "all" ? undefined : val),
  skills: z.string().optional().transform(val => 
    val ? val.split(",").map(s => s.trim()).filter(Boolean) : undefined
  ),
  budgetMin: z.string().optional().transform(val => parseInt(val || "0")),
  budgetMax: z.string().optional().transform(val => parseInt(val || "1000000")),
  type: z.enum(["fixed", "hourly", ""]).optional().transform(val => val || undefined),
  status: z.enum(["draft", "open", "in-progress", "completed", "cancelled", "paused", ""])
    .optional().default("open").transform(val => val || "open"),
  search: z.string().optional().transform(val => val?.trim() || undefined),
  clientId: z.string().optional(),
  lang: z.string().optional().default("fr")
})