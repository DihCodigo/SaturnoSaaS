import { db } from "./db";
import { eq, and, desc, gte, lte, sql, count } from "drizzle-orm";
import {
  users, companies, timeRecords, holidays, adjustmentRequests,
  type User, type InsertUser, type Company, type InsertCompany,
  type TimeRecord, type InsertTimeRecord, type Holiday, type InsertHoliday,
  type AdjustmentRequest, type InsertAdjustmentRequest,
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getEmployeesByCompany(companyId: string): Promise<User[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: string): Promise<Company | undefined>;
  updateCompany(id: string, data: Partial<Company>): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  getTimeRecordsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]>;
  getTimeRecordsByCompany(companyId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]>;
  getTodayRecords(userId: string): Promise<TimeRecord[]>;
  getHolidaysByCompany(companyId: string): Promise<Holiday[]>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  deleteHoliday(id: string): Promise<void>;
  createAdjustmentRequest(request: InsertAdjustmentRequest): Promise<AdjustmentRequest>;
  getAdjustmentsByCompany(companyId: string): Promise<AdjustmentRequest[]>;
  getAdjustmentsByUser(userId: string): Promise<AdjustmentRequest[]>;
  updateAdjustment(id: string, data: Partial<AdjustmentRequest>): Promise<AdjustmentRequest | undefined>;
  countUsersByCompany(companyId: string): Promise<number>;
  countAllUsers(): Promise<number>;
  countTodayRecords(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getEmployeesByCompany(companyId: string): Promise<User[]> {
    return db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.role, "employee")));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [c] = await db.insert(companies).values(company).returning();
    return c;
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<Company | undefined> {
    const [c] = await db.update(companies).set(data).where(eq(companies.id, id)).returning();
    return c;
  }

  async getAllCompanies(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord> {
    const [r] = await db.insert(timeRecords).values(record).returning();
    return r;
  }

  async getTimeRecordsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]> {
    const conditions = [eq(timeRecords.userId, userId)];
    if (startDate) conditions.push(gte(timeRecords.timestamp, startDate));
    if (endDate) conditions.push(lte(timeRecords.timestamp, endDate));
    return db.select().from(timeRecords).where(and(...conditions)).orderBy(desc(timeRecords.timestamp));
  }

  async getTimeRecordsByCompany(companyId: string, startDate?: Date, endDate?: Date): Promise<TimeRecord[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return db.select().from(timeRecords)
      .where(and(eq(timeRecords.companyId, companyId), gte(timeRecords.timestamp, startOfDay)))
      .orderBy(desc(timeRecords.timestamp));
  }

  async getTodayRecords(userId: string): Promise<TimeRecord[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return db.select().from(timeRecords)
      .where(and(eq(timeRecords.userId, userId), gte(timeRecords.timestamp, startOfDay)))
      .orderBy(timeRecords.timestamp);
  }

  async getHolidaysByCompany(companyId: string): Promise<Holiday[]> {
    return db.select().from(holidays)
      .where(eq(holidays.companyId, companyId))
      .orderBy(holidays.date);
  }

  async createHoliday(holiday: InsertHoliday): Promise<Holiday> {
    const [h] = await db.insert(holidays).values(holiday).returning();
    return h;
  }

  async deleteHoliday(id: string): Promise<void> {
    await db.delete(holidays).where(eq(holidays.id, id));
  }

  async createAdjustmentRequest(request: InsertAdjustmentRequest): Promise<AdjustmentRequest> {
    const [a] = await db.insert(adjustmentRequests).values(request).returning();
    return a;
  }

  async getAdjustmentsByCompany(companyId: string): Promise<AdjustmentRequest[]> {
    return db.select().from(adjustmentRequests)
      .where(eq(adjustmentRequests.companyId, companyId))
      .orderBy(desc(adjustmentRequests.id));
  }

  async getAdjustmentsByUser(userId: string): Promise<AdjustmentRequest[]> {
    return db.select().from(adjustmentRequests)
      .where(eq(adjustmentRequests.userId, userId))
      .orderBy(desc(adjustmentRequests.id));
  }

  async updateAdjustment(id: string, data: Partial<AdjustmentRequest>): Promise<AdjustmentRequest | undefined> {
    const [a] = await db.update(adjustmentRequests).set(data).where(eq(adjustmentRequests.id, id)).returning();
    return a;
  }

  async countUsersByCompany(companyId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users).where(and(eq(users.companyId, companyId), eq(users.role, "employee")));
    return result?.count || 0;
  }

  async countAllUsers(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(users);
    return result?.count || 0;
  }

  async countTodayRecords(): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [result] = await db.select({ count: count() }).from(timeRecords).where(gte(timeRecords.timestamp, startOfDay));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
