import { pgTable, uuid, varchar, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const scoringModeEnum = pgEnum("scoring_mode", ["exact", "result"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  scoringMode: scoringModeEnum("scoring_mode").default("exact").notNull(),
  ptsExact: integer("pts_exact").default(3).notNull(),
  ptsResult: integer("pts_result").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 40 }).notNull(),
  sessionToken: varchar("session_token", { length: 64 }).notNull().unique(),
  totalPts: integer("total_pts").default(0).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const predictions = pgTable("predictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  matchId: integer("match_id").notNull(),
  scoreHome: integer("score_home").notNull(),
  scoreAway: integer("score_away").notNull(),
  pointsEarned: integer("points_earned"),
  lockedAt: timestamp("locked_at").notNull(),
});

export const matchCache = pgTable("match_cache", {
  matchId: integer("match_id").primaryKey(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});