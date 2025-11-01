import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const streamTypeEnum = pgEnum("type", [
  "stream",
  "assignment",
  "quiz",
  "question",
  "material",
]);

export const notificationTypeEnum = pgEnum("type", [
  "stream",
  "assignment",
  "quiz",
  "question",
  "material",
  "comment",
  "join",
  "addToClass",
  "submit",
  "grade",
]);

export const roleRequestStatusEnum = pgEnum("status", ["pending", "rejected"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
  role: roleEnum("role").notNull().default("user"),
  schoolName: text("school_name"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  type: notificationTypeEnum("type").notNull(),
  fromUserName: text("from_user_name").notNull(),
  fromUserImage: text("from_user_image").notNull(),
  resourceId: uuid("resource_id").notNull(),
  resourceContent: text("resource_content").notNull(),
  resourceUrl: text("resource_url").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
});

export const roleRequest = pgTable("role_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  userImage: text("user_image").notNull(),
  status: roleRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const note = pgTable("note", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  title: text("title"),
  content: text("content"),
  attachments: text("attachments").array().notNull().default([]),
  isPinned: boolean("is_pinned")
    .$defaultFn(() => false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const classroom = pgTable("class", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject"),
  section: text("section").notNull(),
  description: text("description"),
  room: text("room"),
  code: text("code").notNull(),
  cardBackground: text("card_background").notNull().default("#a7adcb"),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  teacherName: text("teacher_name").notNull(),
  teacherImage: text("teacher_image").notNull(),
  illustrationIndex: integer("illustration_index")
    .$defaultFn(() => Math.floor(Math.random() * 5))
    .notNull(),
  allowUsersToComment: boolean("allow_users_to_comment")
    .$defaultFn(() => false)
    .notNull(),
  allowUsersToPost: boolean("allow_users_to_post")
    .$defaultFn(() => false)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const enrolledClass = pgTable("enrolled_class", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  name: text("name").notNull(),
  subject: text("subject"),
  section: text("section").notNull(),
  teacherName: text("teacher_name").notNull(),
  teacherImage: text("teacher_image").notNull(),
  cardBackground: text("card_background").notNull(),
  illustrationIndex: integer("illustration_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const chat = pgTable("chat", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  message: text("message"),
  attachments: text("attachments").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const classTopic = pgTable("class_topic", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const stream = pgTable("stream", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  className: text("class_name").notNull(),
  title: text("title"),
  content: text("content"),
  type: streamTypeEnum("type").notNull().default("stream"),
  attachments: text("attachments").array().notNull().default([]),
  links: text("links").array().notNull().default([]),
  points: integer("points"),
  isPinned: boolean("is_pinned")
    .$defaultFn(() => false)
    .notNull(),
  acceptingSubmissions: boolean("accepting_submissions")
    .$defaultFn(() => true)
    .notNull(),
  closeSubmissionsAfterDueDate: boolean("close_submissions_after_due_date")
    .$defaultFn(() => false)
    .notNull(),
  announceTo: text("announce_to").array().notNull().default([]),
  announceToAll: boolean("announce_to_all")
    .$defaultFn(() => true)
    .notNull(),
  topicId: uuid("topic_id").references(() => classTopic.id),
  topicName: text("topic_name"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
});

export const classwork = pgTable("classwork", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  className: text("class_name").notNull(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => stream.id),
  title: text("title"),
  attachments: text("attachments").array().notNull().default([]),
  links: text("links").array().notNull().default([]),
  points: integer("points"),
  isGraded: boolean("is_graded")
    .$defaultFn(() => false)
    .notNull(),
  isReturned: boolean("is_returned")
    .$defaultFn(() => false)
    .notNull(),
  streamCreatedAt: timestamp("stream_created_at", {
    withTimezone: true,
  }).notNull(),
  isTurnedIn: boolean("is_turned_in")
    .$defaultFn(() => false)
    .notNull(),
  turnedInDate: timestamp("turned_in_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const streamComment = pgTable("stream_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => stream.id),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  content: text("content"),
  attachment: text("attachment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const streamPrivateComment = pgTable("stream_private_comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  streamId: uuid("stream_id")
    .notNull()
    .references(() => stream.id),
  classId: uuid("class_id")
    .notNull()
    .references(() => classroom.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  userName: text("user_name").notNull(),
  userImage: text("user_image").notNull(),
  content: text("content"),
  attachment: text("attachment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => user.id),
});

export const schema = {
  user,
  account,
  session,
  verification,
  roleRequest,
  note,
  classroom,
  enrolledClass,
  chat,
  classTopic,
  stream,
  classwork,
  streamComment,
  streamPrivateComment,
};
