import { createInsertSchema } from "drizzle-zod";
import {
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { z } from "zod/v4";

export const dancersTable = pgTable("dancers", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  initials: text("initials").notNull(),
  color: text("color").notNull(),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDancerSchema = createInsertSchema(dancersTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDancer = z.infer<typeof insertDancerSchema>;
export type Dancer = typeof dancersTable.$inferSelect;