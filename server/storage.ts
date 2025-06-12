import { users, usageTracking, type User, type InsertUser, type UsageTracking, type InsertUsageTracking } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsageByIpAndDate(ipAddress: string, date: string): Promise<UsageTracking | undefined>;
  createOrUpdateUsage(usage: InsertUsageTracking): Promise<UsageTracking>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsageByIpAndDate(ipAddress: string, date: string): Promise<UsageTracking | undefined> {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(and(eq(usageTracking.ipAddress, ipAddress), eq(usageTracking.usageDate, date)));
    return usage || undefined;
  }

  async createOrUpdateUsage(usage: InsertUsageTracking): Promise<UsageTracking> {
    const existing = await this.getUsageByIpAndDate(usage.ipAddress, usage.usageDate);
    
    if (existing) {
      const [updated] = await db
        .update(usageTracking)
        .set({
          generationCount: existing.generationCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(usageTracking.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(usageTracking)
        .values({
          ...usage,
          generationCount: 1,
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
