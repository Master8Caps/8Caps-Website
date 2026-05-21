"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/**
 * Uploads a file to the `site-media` Storage bucket and returns its public URL.
 * `folder` groups uploads (e.g. "logos", "screenshots").
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File, folder: string): Promise<string> {
    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("site-media").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}
