import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const annotationPointSchema = z.object({ x: z.number(), y: z.number() });
export const annotationStrokeSchema = z.object({
  id: z.string(),
  tool: z.enum(["pencil", "highlighter"]),
  color: z.string(),
  width: z.number().positive(),
  points: z.array(annotationPointSchema),
});
export const annotationTextSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  text: z.string(),
  color: z.string(),
});
export const countAnnotationDataSchema = z.object({
  strokes: z.array(annotationStrokeSchema),
  texts: z.array(annotationTextSchema),
});

export type AnnotationPoint = z.infer<typeof annotationPointSchema>;
export type AnnotationStroke = z.infer<typeof annotationStrokeSchema>;
export type AnnotationText = z.infer<typeof annotationTextSchema>;
export type CountAnnotationData = z.infer<typeof countAnnotationDataSchema>;

export const countAnnotationsTable = pgTable(
  "count_annotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    countNumber: integer("count_number").notNull(),
    data: jsonb("data").$type<CountAnnotationData>().notNull().default({ strokes: [], texts: [] }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("count_annotations_project_count_unique").on(
      table.projectId,
      table.countNumber,
    ),
  ],
);

export const insertCountAnnotationSchema = createInsertSchema(countAnnotationsTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertCountAnnotation = z.infer<typeof insertCountAnnotationSchema>;
export type CountAnnotation = typeof countAnnotationsTable.$inferSelect;
