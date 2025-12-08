import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import type { Stream } from "../schema/index.js";
import { classTopic, stream } from "../../db/schema.js";
import { getClassTopicByTopicId } from "../service/topic.js";
import { getAllStreamsByTopicId } from "../service/stream.js";
import { getClassroomByClassId } from "../service/classroom.js";
import type { CreateTopic, UpdateTopic, DeleteTopic } from "../schema/index.js";

export async function deleteTopicByTopicIdAndUserId(
  topicId: string,
  userId: string
) {
  const topic = await getClassTopicByTopicId(topicId);

  if (!topic) throw new Error("This topic does not exist.");

  const classroom = await getClassroomByClassId(topic.classId);

  if (!classroom) throw new Error("This class does not exist.");

  if (userId !== classroom.teacherId)
    throw new Error("Only the creator of this class can delete topics.");

  const streams = await getAllStreamsByTopicId(topicId);

  if (streams?.length) {
    for (const stream of streams) {
      await updateClassStreamPostTopic("delete", stream);
    }
  }

  await db.delete(classTopic).where(eq(classTopic.id, topicId)).returning();
}

export async function updateClassStreamPostTopic(
  type: "edit" | "delete",
  streamData: Stream,
  topicName?: string
) {
  switch (type) {
    case "edit":
      await db
        .update(stream)
        .set({ topicName: topicName ?? null })
        .where(eq(stream.id, streamData.id))
        .returning();
      break;

    case "delete":
      await db
        .update(stream)
        .set({ topicName: null, topicId: null })
        .where(eq(stream.id, streamData.id))
        .returning();
      break;
    default:
      return;
  }
}

export async function createTopic(body: CreateTopic, userId: string) {
  const { classroomId, topicName } = body;

  const classroom = await getClassroomByClassId(classroomId);
  if (!classroom) throw new Error("Classroom not found");

  if (classroom.teacherId !== userId)
    throw new Error("Only the teacher can create topics");

  const data = await db
    .insert(classTopic)
    .values({
      classId: classroomId,
      name: topicName,
    })
    .returning();

  if (!data.length) {
    throw new Error("Failed to create topic");
  }

  return data[0];
}

export async function updateTopic(body: UpdateTopic, userId: string) {
  const { classroomId, topicId, topicName } = body;

  const classroom = await getClassroomByClassId(classroomId);
  if (!classroom) throw new Error("Classroom not found");

  if (classroom.teacherId !== userId)
    throw new Error("Only the teacher can update topics");

  const topic = await getClassTopicByTopicId(topicId);
  if (!topic) throw new Error("Topic not found");

  const data = await db
    .update(classTopic)
    .set({ name: topicName })
    .where(eq(classTopic.id, topicId))
    .returning();

  if (!data.length) {
    throw new Error("Failed to update topic");
  }

  const streams = await getAllStreamsByTopicId(topicId);
  if (streams?.length) {
    for (const stream of streams) {
      await updateClassStreamPostTopic("edit", stream, topicName);
    }
  }

  return data[0];
}

export async function deleteTopic(body: DeleteTopic, userId: string) {
  const { topicId } = body;

  const topic = await getClassTopicByTopicId(topicId);
  if (!topic) throw new Error("Topic not found");

  const classroom = await getClassroomByClassId(topic.classId);
  if (!classroom) throw new Error("Classroom not found");

  if (classroom.teacherId !== userId)
    throw new Error("Only the teacher can delete topics");

  const streams = await getAllStreamsByTopicId(topicId);
  if (streams?.length) {
    for (const stream of streams) {
      await updateClassStreamPostTopic("delete", stream);
    }
  }

  const data = await db
    .delete(classTopic)
    .where(eq(classTopic.id, topicId))
    .returning();

  if (!data.length) {
    throw new Error("Failed to delete topic");
  }

  return data[0];
}
