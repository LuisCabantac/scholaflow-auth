import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { classTopic, stream } from "../../db/schema.js";
import type { Stream } from "../schema/index.js";
import { getClassTopicByTopicId } from "../service/topic.js";
import { getClassroomByClassId } from "../service/classroom.js";
import { getAllStreamsByTopicId } from "../service/stream.js";

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
