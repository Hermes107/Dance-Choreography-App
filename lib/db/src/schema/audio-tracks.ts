import { createInsertSchema } from "drizzle-zod";
import { pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const audioTracksTable = pgTable(
  "audio_tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    durationSeconds: real("duration_seconds").notNull(),
    bpm: real("bpm").notNull().default(120),
    startOffsetSeconds: real("start_offset_seconds").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("audio_tracks_project_id_unique").on(table.projectId)],
);

export const insertAudioTrackSchema = createInsertSchema(audioTracksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAudioTrack = z.infer<typeof insertAudioTrackSchema>;
export type AudioTrack = typeof audioTracksTable.$inferSelect;
