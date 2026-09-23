import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const positionSchema = z.object({
  dancerId: z.string().uuid(),
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof positionSchema>;

export const keyframesTable = pgTable("keyframes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  positions: jsonb("positions").$type<Position[]>().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertKeyframeSchema = createInsertSchema(keyframesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKeyframe = z.infer<typeof insertKeyframeSchema>;
export type Keyframe = typeof keyframesTable.$inferSelect;