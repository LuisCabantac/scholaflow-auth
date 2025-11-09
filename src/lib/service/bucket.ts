import { v4 as uuidv4 } from "uuid";
import type { Context } from "hono";

import { getSupabase } from "../supabase-client.js";

export async function uploadAttachments(
  c: Context,
  bucketName: string,
  classroomId: string,
  file: File
) {
  if (file.name !== "undefined") {
    const supabase = getSupabase(c);
    const sanitizedFileName = file.name.replace(/~/g, "").replace(/\s+/g, "_");
    const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
    const { data: attachment, error } = await supabase.storage
      .from(`${bucketName}/${classroomId}`)
      .upload(`${name}_${uuidv4()}.${extension}`, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(`${bucketName}/${classroomId}`)
      .getPublicUrl(attachment.path);
    return publicUrl;
  }
}

export async function deleteFilesFromBucket(
  ctx: Context,
  bucketName: string,
  filePath: string[]
) {
  const supabase = getSupabase(ctx);
  const { error } = await supabase.storage.from(bucketName).remove(filePath);

  if (error)
    throw new Error(
      `${filePath} cannot be deleted from the ${bucketName} bucket`
    );
}

export async function deleteFileFromBucket(
  ctx: Context,
  bucketName: string,
  filePath: string
) {
  const supabase = getSupabase(ctx);

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error)
    throw new Error(
      `${filePath} cannot be deleted from the ${bucketName} bucket`
    );
}
