import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin_master", "admin_company", "employee"]);

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  geoLat: real("geo_lat"),
  geoLng: real("geo_lng"),
  geoRadius: integer("geo_radius").default(100),
  workHoursMinutes: integer("work_hours_minutes").default(528),
  closingDayStart: integer("closing_day_start").default(1),
  closingDayEnd: integer("closing_day_end").default(1),
  toleranceMinutes: integer("tolerance_minutes").default(10),
  active: boolean("active").default(true),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  companyId: varchar("company_id").references(() => companies.id),
  department: text("department"),
  position: text("position"),
  workHoursMinutes: integer("work_hours_minutes"),
  mustChangePassword: boolean("must_change_password").default(false),
  active: boolean("active").default(true),
});

export const timeRecords = pgTable("time_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  ip: text("ip"),
});

export const holidays = pgTable("holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").references(() => companies.id),
  name: text("name").notNull(),
  date: text("date").notNull(),
  national: boolean("national").default(false),
});

export const adjustmentRequests = pgTable("adjustment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyId: varchar("company_id").notNull().references(() => companies.id),
  date: text("date").notNull(),
  requestedTime: text("requested_time"),
  type: text("type").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  createdBy: text("created_by").notNull().default("employee"),
  adminNote: text("admin_note"),
  irregularityType: text("irregularity_type"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({ id: true, timestamp: true });
export const insertHolidaySchema = createInsertSchema(holidays).omit({ id: true });
export const insertAdjustmentRequestSchema = createInsertSchema(adjustmentRequests).omit({ id: true, reviewedBy: true, reviewedAt: true });

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type AdjustmentRequest = typeof adjustmentRequests.$inferSelect;
export type InsertAdjustmentRequest = z.infer<typeof insertAdjustmentRequestSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
