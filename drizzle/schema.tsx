import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, jsonb, timestamp, integer, bigint, bytea, index, uniqueIndex, pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

/* ===== Enums ===== */
export const projectType = pgEnum("project_type", ["code", "image", "video", "security"]);
export const projectStatus = pgEnum("project_status", ["processing", "completed", "failed"]);
export const aiModel = pgEnum("ai_model", ["gemini", "runway", "imagen"]);

/* ===== Helpers ===== */
const cuid = () => createId();

/* ===== Users ===== */
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(cuid),
  username: varchar("username", { length: 120 }).notNull().unique(),
  // never store plaintext; store a hash
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()
});

/* ===== Projects ===== */
export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(cuid),
  name: text("name").notNull(),
  description: text("description"),
  type: projectType("type").notNull(),
  status: projectStatus("status").notNull().default("processing"),
  prompt: text("prompt").notNull(),
  result: jsonb("result"), // arbitrary generation output
  aiModel: aiModel("ai_model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
}, (t) => ({
  byUser: index("projects_user_idx").on(t.userId),
  byStatus: index("projects_status_idx").on(t.status),
  byCreated: index("projects_created_idx").on(t.createdAt)
}));

/* ===== Generated Files ===== */
export const generatedFiles = pgTable("generated_files", {
  id: text("id").primaryKey().$defaultFn(cuid),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // javascript; typescript; css; html; image; video
  content: text("content"),              // for text based outputs
  // prefer bytea for raw binaries; or keep external storage and store urls only
  binaryData: bytea("binary_data"),
  size: integer("size").notNull().default(0),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  byProject: index("genfiles_project_idx").on(t.projectId),
  uniqueNameInProject: uniqueIndex("genfiles_project_name_uq").on(t.projectId, t.fileName)
}));

/* ===== Security Scans ===== */
export const securityScans = pgTable("security_scans", {
  id: text("id").primaryKey().$defaultFn(cuid),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  // jsonb defaults must be cast at the DB level
  vulnerabilities: jsonb("vulnerabilities").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  codeQuality: text("code_quality").default("A+"),
  blockchainSecurity: text("blockchain_security").default("SECURE"),
  recommendations: jsonb("recommendations").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  byProject: index("scans_project_idx").on(t.projectId),
  byCreated: index("scans_created_idx").on(t.createdAt)
}));

/* ===== Aurebix Projects ===== */
export const aurebixProjects = pgTable("aurebix_projects", {
  id: text("id").primaryKey().$defaultFn(cuid),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  stack: jsonb("stack").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  frontendCode: text("frontend_code"),
  backendCode: text("backend_code"),
  contractCode: text("contract_code"),
  deploymentUrl: text("deployment_url"),
  status: text("status").notNull().default("generating"), // generating; ready; deployed; error
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()
}, (t) => ({
  byUser: index("abx_projects_user_idx").on(t.userId),
  byStatus: index("abx_projects_status_idx").on(t.status)
}));

/* ===== Aurebix Templates ===== */
export const aurebixTemplates = pgTable("aurebix_templates", {
  id: text("id").primaryKey().$defaultFn(cuid),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // web2; web3; dapp; api
  stack: jsonb("stack").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  // keep price in minor units; use bigint to avoid overflow
  priceMinor: bigint("price_minor", { mode: "number" }).notNull().default(0), // lamports or cents
  features: jsonb("features").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  frontendTemplate: text("frontend_template"),
  backendTemplate: text("backend_template"),
  contractTemplate: text("contract_template"),
  downloads: integer("downloads").notNull().default(0),
  rating: integer("rating").notNull().default(5),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  byCategory: index("abx_templates_cat_idx").on(t.category),
  byCreator: index("abx_templates_creator_idx").on(t.createdBy)
}));

/* ===== Wallet Balances ===== */
export const walletBalances = pgTable("wallet_balances", {
  id: text("id").primaryKey().$defaultFn(cuid),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletAddress: varchar("wallet_address", { length: 128 }).notNull(),
  // lamports can exceed 32 bit; use bigint
  solLamports: bigint("sol_lamports", { mode: "number" }).notNull().default(0),
  vermUnits: bigint("verm_units", { mode: "number" }).notNull().default(0),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()
}, (t) => ({
  uniqUserWallet: uniqueIndex("wallet_user_address_uq").on(t.userId, t.walletAddress),
  byUser: index("wallet_user_idx").on(t.userId)
}));

/* ===== Zod Insert Schemas and Types ===== */
// Users
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Projects
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Generated Files
export const insertFileSchema = createInsertSchema(generatedFiles).omit({
  id: true, createdAt: true
});
export type InsertFile = z.infer<typeof insertFileSchema>;
export type GeneratedFile = typeof generatedFiles.$inferSelect;

// Security Scans
export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({
  id: true, createdAt: true
});
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;

// Aurebix Projects
export const insertAurebixProjectSchema = createInsertSchema(aurebixProjects).omit({
  id: true, createdAt: true, updatedAt: true
});
export type InsertAurebixProject = z.infer<typeof insertAurebixProjectSchema>;
export type AurebixProject = typeof aurebixProjects.$inferSelect;

// Aurebix Templates
export const insertAurebixTemplateSchema = createInsertSchema(aurebixTemplates).omit({
  id: true, createdAt: true
});
export type InsertAurebixTemplate = z.infer<typeof insertAurebixTemplateSchema>;
export type AurebixTemplate = typeof aurebixTemplates.$inferSelect;

// Wallet Balances
export const insertWalletBalanceSchema = createInsertSchema(walletBalances).omit({
  id: true, lastUpdated: true
});
export type InsertWalletBalance = z.infer<typeof insertWalletBalanceSchema>;
export type WalletBalance = typeof walletBalances.$inferSelect;

/* ===== AI Generation Request Types ===== */
export const aiGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(projectType.enumValues as [string, ...string[]]),  // align with enum
  aiModel: z.enum(aiModel.enumValues as [string, ...string[]]),
  options: z.object({
    language: z.string().optional(),
    framework: z.string().optional(),
    includeTests: z.boolean().optional(),
    stylePreferences: z.string().optional(),
    code: z.string().optional(),
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
      type: z.string()
    })).optional()
  }).optional()
});
export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;

/* Optional deployment schema if you need it */
export const DeploymentSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  status: z.string().optional()
});
export type Deployment = z.infer<typeof DeploymentSchema>;
