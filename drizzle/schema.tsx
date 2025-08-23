
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { createId } from '@paralleldrive/cuid2';
import { z } from 'zod';

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'code', 'image', 'video', 'security'
  status: text("status").notNull().default('processing'), // 'processing', 'completed', 'failed'
  prompt: text("prompt").notNull(),
  result: jsonb("result"), // Generated content and metadata
  aiModel: text("ai_model").notNull(), // 'gemini', 'runway', 'imagen'
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id").references(() => users.id),
});

export const generatedFiles = pgTable("generated_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // 'javascript', 'typescript', 'css', 'html', 'image', 'video'
  content: text("content"), // For text files
  binaryData: text("binary_data"), // Base64 encoded for binary files
  size: integer("size").notNull().default(0),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const securityScans = pgTable("security_scans", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  vulnerabilities: jsonb("vulnerabilities").$type<string[]>().default([]),
  codeQuality: text("code_quality").default("A+"),
  blockchainSecurity: text("blockchain_security").default("SECURE"),
  recommendations: jsonb("recommendations").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aurebixProjects = pgTable("aurebix_projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  stack: jsonb("stack").$type<string[]>().notNull(),
  frontendCode: text("frontend_code"),
  backendCode: text("backend_code"),
  contractCode: text("contract_code"),
  deploymentUrl: text("deployment_url"),
  status: text("status").notNull().default("generating"), // generating, ready, deployed, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aurebixTemplates = pgTable("aurebix_templates", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // web2, web3, dapp, api
  stack: jsonb("stack").$type<string[]>().notNull(),
  price: integer("price").notNull().default(0), // in SOL (lamports)
  features: jsonb("features").$type<string[]>().notNull(),
  frontendTemplate: text("frontend_template"),
  backendTemplate: text("backend_template"),
  contractTemplate: text("contract_template"),
  downloads: integer("downloads").default(0),
  rating: integer("rating").default(5),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletBalances = pgTable("wallet_balances", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  solBalance: integer("sol_balance").default(0), // in lamports
  vermBalance: integer("verm_balance").default(0), // in token units
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(generatedFiles).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Aurebix
export const insertAurebixProjectSchema = createInsertSchema(aurebixProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAurebixTemplateSchema = createInsertSchema(aurebixTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertWalletBalanceSchema = createInsertSchema(walletBalances).omit({
  id: true,
  lastUpdated: true,
});

// Types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
// Add proper schema inference types:
export type ProjectInsert = typeof projects.$inferInsert;
export type FileInsert = typeof generatedFiles.$inferInsert;

// Add missing DeploymentSchema:
export const DeploymentSchema = z.object({
  id: z.string(),
  // Add other deployment fields as needed
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertSecurityScan = typeof securityScans.$inferInsert;

export type AurebixProject = typeof aurebixProjects.$inferSelect;
export type InsertAurebixProject = typeof aurebixProjects.$inferInsert;

export type AurebixTemplate = typeof aurebixTemplates.$inferSelect;
export type InsertAurebixTemplate = typeof aurebixTemplates.$inferInsert;

export type WalletBalance = typeof walletBalances.$inferSelect;
export type InsertWalletBalance = typeof walletBalances.$inferInsert;

export type InsertProject = typeof insertProjectSchema.$inferInsert;
export type GeneratedFile = typeof generatedFiles.$inferSelect;
export type InsertFile = typeof insertFileSchema.$inferInsert;

// AI Generation Request Types
export const aiGenerationRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  type: z.enum(['code', 'image', 'video', 'security']),
  aiModel: z.enum(['gemini', 'runway', 'imagen']),
  options: z.object({
    language: z.string().optional(),
    framework: z.string().optional(),
    includeTests: z.boolean().optional(),
    stylePreferences: z.string().optional(),
    code: z.string().optional(), // For security scans
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
      type: z.string()
    })).optional(), // For file uploads
  }).optional(),
});

export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['code', 'image', 'video', 'security']),
  status: z.enum(['processing', 'completed', 'failed']).default('processing'),
  prompt: z.string(),
  result: z.unknown().optional(),
  aiModel: z.enum(['gemini', 'runway', 'imagen']),
  createdAt: z.date().optional(),
  userId: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export type Deployment = z.infer<typeof DeploymentSchema>;
        