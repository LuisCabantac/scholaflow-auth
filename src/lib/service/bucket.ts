import { v4 as uuidv4 } from "uuid";
import type { Context } from "hono";

import { getSupabase } from "../supabase-client.js";

export interface Base64Attachment {
  base64: string;
  type: string;
  name: string;
}

export async function uploadAttachmentFromBase64(
  ctx: Context,
  bucketName: string,
  classroomId: string,
  attachment: Base64Attachment
) {
  if (!attachment || !attachment.base64 || !attachment.name) {
    throw new Error("Invalid attachment data provided");
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

  const base64Data = attachment.base64.split(",")[1] || attachment.base64;
  const buffer = Buffer.from(base64Data, "base64");

  const sanitizedFileName = attachment.name
    .replace(/~/g, "")
    .replace(/\s+/g, "_");
  const [name, extension] = sanitizedFileName.split(/\.(?=[^\.]+$)/);
  const fileName = `${name}_${uuidv4()}.${extension}`;

  const { data: uploadData, error } = await supabase.storage
    .from(`${bucketName}/${classroomId}`)
    .upload(fileName, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: attachment.type,
    });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(`${bucketName}/${classroomId}`)
    .getPublicUrl(uploadData.path);

  return publicUrl;
}

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
