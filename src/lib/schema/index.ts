import { z } from "zod";
import type { Base64Attachment } from "../service/bucket.js";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.union([z.literal("user"), z.literal("admin")]),
  schoolName: z.nullable(z.string()),
});

export type User = z.infer<typeof userSchema>;

export const editUserSchema = userSchema.omit({
  id: true,
  emailVerified: true,
  createdAt: true,
  role: true,
});

export const accountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.nullable(z.string()),
  refreshToken: z.nullable(z.string()),
  idToken: z.nullable(z.string()),
  accessTokenExpiresAt: z.nullable(z.date()),
  refreshTokenExpiresAt: z.nullable(z.date()),
  scope: z.nullable(z.string()),
  password: z.nullable(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Account = z.infer<typeof accountSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.string(),
  schoolName: z.string().optional().nullable(),
});

export type Session = z.infer<typeof sessionSchema>;

export const verificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.email(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.nullable(z.date()),
});

export type Verification = z.infer<typeof verificationSchema>;

export const notificationType = z.union([
  z.literal("stream"),
  z.literal("assignment"),
  z.literal("quiz"),
  z.literal("question"),
  z.literal("material"),
  z.literal("comment"),
  z.literal("join"),
  z.literal("addToClass"),
  z.literal("submit"),
  z.literal("grade"),
]);

export type NotificationType = z.infer<typeof notificationType>;

export const notificationSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  type: notificationType,
  fromUserName: z.string(),
  fromUserImage: z.string(),
  resourceId: z.uuid(),
  resourceContent: z.string(),
  resourceUrl: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const readNotificationSchema = notificationSchema.omit({
  isRead: true,
});

export const roleRequestSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  userImage: z.string(),
  status: z.union([z.literal("pending"), z.literal("rejected")]),
  createdAt: z.date(),
});

export type RoleRequest = z.infer<typeof roleRequestSchema>;

export const createRoleRequestSchema = roleRequestSchema.omit({
  id: true,
  createdAt: true,
});

export const editRoleRequestSchema = roleRequestSchema.omit({
  id: true,
  userId: true,
  userName: true,
  userEmail: true,
  userImage: true,
  createdAt: true,
});

export const classroomSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  subject: z.nullable(z.string()),
  section: z.string(),
  description: z.nullable(z.string()),
  room: z.nullable(z.string()),
  code: z.string(),
  cardBackground: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  teacherImage: z.string(),
  illustrationIndex: z.number(),
  allowUsersToComment: z.boolean(),
  allowUsersToPost: z.boolean(),
  createdAt: z.date(),
});

export type Classroom = z.infer<typeof classroomSchema>;

export const classroomType = z.union([
  z.literal("created"),
  z.literal("enrolled"),
]);

export const createClassroomSchema = classroomSchema.omit({
  id: true,
  description: true,
  allowUsersToComment: true,
  allowUsersToPost: true,
  createdAt: true,
});

export const enrolledClassSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  name: z.string(),
  subject: z.nullable(z.string()),
  section: z.string(),
  teacherName: z.string(),
  teacherImage: z.string(),
  cardBackground: z.string(),
  illustrationIndex: z.number(),
  createdAt: z.date(),
});

export type EnrolledClass = z.infer<typeof enrolledClassSchema>;

export const createEnrolledClassSchema = enrolledClassSchema.omit({
  id: true,
  createdAt: true,
});

export const classworkSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  classId: z.uuid(),
  className: z.string(),
  streamId: z.uuid(),
  title: z.nullable(z.string()),
  attachments: z.array(z.string()),
  links: z.array(z.string()),
  points: z.nullable(z.number()),
  isGraded: z.boolean(),
  isReturned: z.boolean(),
  streamCreatedAt: z.date(),
  isTurnedIn: z.boolean(),
  turnedInDate: z.nullable(z.date()),
  createdAt: z.date(),
});

export type Classwork = z.infer<typeof classworkSchema>;

export const createClassworkSchema = classworkSchema.omit({
  id: true,
  createdAt: true,
});

export const classTopicSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  name: z.string(),
  createdAt: z.date(),
});

export type ClassTopic = z.infer<typeof classTopicSchema>;

export const createClassTopicSchema = classTopicSchema.omit({
  id: true,
  createdAt: true,
});

export const editClassTopicSchema = classTopicSchema.omit({
  id: true,
  classId: true,
  createdAt: true,
});

export const streamType = z.union([
  z.literal("stream"),
  z.literal("assignment"),
  z.literal("quiz"),
  z.literal("question"),
  z.literal("material"),
]);

export type StreamType = z.infer<typeof streamType>;

export const streamSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  classId: z.uuid(),
  className: z.string(),
  title: z.nullable(z.string()),
  content: z.nullable(z.string()),
  type: streamType,
  attachments: z.array(z.string()),
  links: z.array(z.string()),
  points: z.nullable(z.number()),
  isPinned: z.boolean(),
  acceptingSubmissions: z.boolean(),
  closeSubmissionsAfterDueDate: z.boolean(),
  announceTo: z.array(z.string()),
  announceToAll: z.boolean(),
  topicId: z.nullable(z.uuid()),
  topicName: z.nullable(z.string()),
  dueDate: z.nullable(z.date()),
  createdAt: z.date(),
  updatedAt: z.nullable(z.date()),
  scheduledAt: z.nullable(z.date()),
});

export type Stream = z.infer<typeof streamSchema>;

export const streamInsertSchema = streamSchema.omit({
  id: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
});

export const createStreamSchema = z.object({
  classroomId: z.string().min(1),
  streamType: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
  links: z.array(z.string()).optional(),
  announceTo: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  dueDate: z.string().optional(),
  scheduledAt: z.string().optional(),
  acceptingSubmissions: z.boolean().optional(),
  closeSubmissionsAfterDueDate: z.boolean().optional(),
  totalPoints: z.number().optional(),
});

export type CreateStream = z.infer<typeof createStreamSchema>;

export const editStreamSchema = streamSchema.omit({
  id: true,
  userId: true,
  userName: true,
  userImage: true,
  classId: true,
  className: true,
  type: true,
  isPinned: true,
  createdAt: true,
});

export const updateStreamSchema = z.object({
  streamId: z.string().min(1),
  classroomId: z.string().min(1),
  streamType: z.string().min(1),
  title: z.string().optional(),
  caption: z.string().optional(),
  attachments: z.array(z.instanceof(File)).optional(),
  links: z.array(z.string()).optional(),
  announceTo: z.array(z.string()).optional(),
  topicId: z.string().optional(),
  dueDate: z.string().optional(),
  scheduledAt: z.string().optional(),
  acceptingSubmissions: z.boolean().optional(),
  closeSubmissionsAfterDueDate: z.boolean().optional(),
  totalPoints: z.number().optional(),
  curUrlLinks: z.array(z.string()).optional(),
  curAttachments: z.array(z.string()).optional(),
});

export type UpdateStream = z.infer<typeof updateStreamSchema>;

export const deleteStreamSchema = z.object({
  streamId: z.string().min(1),
});

export type DeleteStream = z.infer<typeof deleteStreamSchema>;

export const streamCommentSchema = z.object({
  id: z.uuid(),
  streamId: z.uuid(),
  classId: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  content: z.nullable(z.string()),
  attachment: z.nullable(z.string()),
  createdAt: z.date(),
  updatedAt: z.nullable(z.date()),
});

export type StreamComment = z.infer<typeof streamCommentSchema>;

export const createStreamCommentSchema = streamCommentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const editStreamCommentSchema = streamCommentSchema.omit({
  createdAt: true,
});

export const streamPrivateCommentSchema = z.object({
  id: z.uuid(),
  streamId: z.uuid(),
  classId: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  content: z.nullable(z.string()),
  attachment: z.nullable(z.string()),
  createdAt: z.date(),
  updatedAt: z.nullable(z.date()),
  toUserId: z.string(),
});

export type StreamPrivateComment = z.infer<typeof streamPrivateCommentSchema>;

export const createStreamPrivateCommentSchema = streamPrivateCommentSchema.omit(
  { id: true, createdAt: true, updatedAt: true }
);

export const editStreamPrivateCommentSchema = streamPrivateCommentSchema.omit({
  id: true,
  createdAt: true,
});

export const noteSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  title: z.nullable(z.string()),
  content: z.nullable(z.string()),
  attachments: z.array(z.string()),
  isPinned: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.nullable(z.date()),
});

export type Note = z.infer<typeof noteSchema>;

export const createNoteSchema = z.object({
  userId: z.string(),
  title: z.nullable(z.string()),
  content: z.nullable(z.string()),
  attachments: z.array(z.string()),
  isPinned: z.boolean(),
  updatedAt: z.nullable(z.date()),
});

export type CreateNote = z.infer<typeof createNoteSchema>;

export type NoteAttachmentInput = string | File | Base64Attachment;

export const editNoteSchema = noteSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const chatSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string(),
  classId: z.uuid(),
  message: z.nullable(z.string()),
  attachments: z.array(z.string()),
  createdAt: z.date(),
});

export type Chat = z.infer<typeof chatSchema>;

export const createChatSchema = chatSchema.omit({ id: true, createdAt: true });

export const nanoidId = z.nanoid();

export const uuidv4Id = z.uuidv4();

export const fullNameSchema = z
  .string()
  .min(2, { message: "Name must be at least 2 characters long" })
  .max(50, { message: "Name must be no more than 50 characters long" })
  .regex(/^[a-zA-Z\s'-]+$/, {
    message: "Name can only contain letters, spaces, hyphens, and apostrophes",
  })
  .refine((name) => name.trim().split(/\s+/).length >= 2, {
    message: "Please enter both first and last name",
  });

export const emailSchema = z.email();

export const createClassSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional(),
  section: z.string().min(1),
  room: z.string().optional(),
  cardBackground: z.string().min(1),
  illustrationIndex: z.number().int().min(0).max(4),
  code: z.string().min(1),
  teacherId: z.string().min(1),
  teacherName: z.string().min(1),
  teacherImage: z.string().min(1),
});

export type CreateClass = z.infer<typeof createClassSchema>;

export const updateClassSchema = z.object({
  className: z.string().min(1),
  subject: z.string().optional(),
  section: z.string().optional(),
  classDescription: z.string().optional(),
  allowStudentsToComment: z.boolean(),
  color: z.string().min(1),
  allowStudentsToPost: z.boolean(),
  updateClassCode: z.boolean().optional(),
});

export type UpdateClass = z.infer<typeof updateClassSchema>;

export const joinClassSchema = z.object({
  classId: z.string().min(1),
});

export type JoinClass = z.infer<typeof joinClassSchema>;

export const submitClassworkSchema = z.object({
  classworkId: z.string().min(1),
  userId: z.string().min(1),
  submission: z.string().min(1),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type SubmitClasswork = z.infer<typeof submitClassworkSchema>;

export const updateClassworkSchema = z.object({
  classworkId: z.string().min(1),
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
  attachments: z.array(z.instanceof(File)).optional(),
  links: z.array(z.string()).optional(),
  curUrlLinks: z.array(z.string()).optional(),
  curAttachments: z.array(z.string()).optional(),
  isTurned: z.boolean().optional(),
});

export type UpdateClasswork = z.infer<typeof updateClassworkSchema>;

export const unsubmitClassworkSchema = z.object({
  classworkId: z.string().min(1),
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
});

export type UnsubmitClasswork = z.infer<typeof unsubmitClassworkSchema>;

export const addGradeClassworkSchema = z.object({
  userId: z.string().min(1),
  streamId: z.string().min(1),
  classroomId: z.string().min(1),
  classworkId: z.string().min(1),
  userPoints: z.number().optional(),
});

export type AddGradeClasswork = z.infer<typeof addGradeClassworkSchema>;

export const addCommentSchema = z.object({
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
  comment: z.string().min(1),
  attachment: z.instanceof(File).optional(),
});

export type AddComment = z.infer<typeof addCommentSchema>;

export const addPrivateCommentSchema = z.object({
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
  userId: z.string().min(1),
  comment: z.string().min(1),
  attachment: z.instanceof(File).optional(),
});

export type AddPrivateComment = z.infer<typeof addPrivateCommentSchema>;

export const deleteCommentSchema = z.object({
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
  commentId: z.string().min(1),
});

export type DeleteComment = z.infer<typeof deleteCommentSchema>;

export const deletePrivateCommentSchema = z.object({
  classroomId: z.string().min(1),
  streamId: z.string().min(1),
  commentId: z.string().min(1),
});

export type DeletePrivateComment = z.infer<typeof deletePrivateCommentSchema>;

export const addUserToClassSchema = z.object({
  classroomId: z.string().min(1),
  email: z.email(),
});

export type AddUserToClass = z.infer<typeof addUserToClassSchema>;

export const deleteEnrolledClassSchema = z.object({
  enrolledClassId: z.string().min(1),
  classId: z.string().min(1),
});

export type DeleteEnrolledClass = z.infer<typeof deleteEnrolledClassSchema>;

export const addMessageSchema = z.object({
  classroomId: z.string().min(1),
  message: z.string().min(1),
  attachments: z.array(z.instanceof(File)).optional(),
});

export type AddMessage = z.infer<typeof addMessageSchema>;

export const createTopicSchema = z.object({
  classroomId: z.string().min(1),
  topicName: z.string().min(1),
});

export type CreateTopic = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z.object({
  classroomId: z.string().min(1),
  topicId: z.string().min(1),
  topicName: z.string().min(1),
});

export type UpdateTopic = z.infer<typeof updateTopicSchema>;

export const deleteTopicSchema = z.object({
  topicId: z.string().min(1),
});

export type DeleteTopic = z.infer<typeof deleteTopicSchema>;
