import { v4 as uuidv4 } from "uuid";
import type { Context } from "hono";

import { getSupabase } from "../supabase-client.js";

export async function uploadAttachments(
  ctx: Context,
  bucketName: string,
  classroomId: string,
  file: File
) {
  if (!file || !file.name || file.name === "undefined") {
    throw new Error("Invalid file provided");
  }

  const supabase = getSupabase(ctx);
  if (!supabase) {
    throw new Error(
      "Supabase client is not initialized. Check if supabaseMiddleware is applied."
    );
  }

  if (!supabase.storage) {
    throw new Error("Supabase storage is not available");
  }

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

export async function deleteFilesFromBucket(
  ctx: Context,
  bucketName: string,
  filePath: string[]
) {
  const supabase = getSupabase(ctx);
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

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
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error)
    throw new Error(
      `${filePath} cannot be deleted from the ${bucketName} bucket`
    );
}
