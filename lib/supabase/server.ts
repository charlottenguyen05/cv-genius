import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client with service role (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false, // false because no way to persist Session in server (API route handler)
  },
});

// Upload PDF to cv-files bucket using admin client
export const uploadPdfToStorageAdmin = async (filePath: string, file: Buffer) => {
  const { data, error } = await supabaseAdmin.storage.from("cv-files").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: "application/pdf",
  });

  if (error) {
    console.error("Error uploading PDF:", error.message);
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
};

// Create resume using admin client
export const createResumeAdmin = async (resumeData: {
  user_id?: string | null;
  title: string;
  generated_content: string;
}) => {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .insert({
      user_id: resumeData.user_id || null,
      title: resumeData.title,
      generated_content: resumeData.generated_content,
      created_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error("Error creating resume:", error.message);
    throw new Error(`Failed to save resume: ${error.message}`);
  }

  return data[0];
};
