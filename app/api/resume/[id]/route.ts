// /api/resume/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { authenticateUser, createErrorResponse } from "@/lib/utils/apiRoutes";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate the caller
    const user = await authenticateUser(req);
    const resumeId = params.id;

    // 2. Fetch the resume to verify ownership and get the storage path
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, user_id, generated_content")
      .eq("id", resumeId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: "CV introuvable" },
        { status: 404 }
      );
    }

    // 3. Ensure the resume belongs to the authenticated user
    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    // 4. Delete the file from storage (non-fatal if it fails)
    if (existing.generated_content) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("cv-files")
        .remove([existing.generated_content]);

      if (storageError) {
        console.error(
          "Error deleting file from storage:",
          storageError.message
        );
        // Continue — storage cleanup failure should not block DB record deletion
      }
    }

    // 5. Delete the database record using admin client (bypasses RLS)
    const { error: dbError } = await supabaseAdmin
      .from("resumes")
      .delete()
      .eq("id", resumeId);

    if (dbError) {
      console.error("Error deleting resume record:", dbError.message);
      throw new Error(dbError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}
