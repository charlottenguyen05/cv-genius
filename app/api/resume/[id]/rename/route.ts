// /api/resume/[id]/rename/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { authenticateUser, createErrorResponse } from "@/lib/utils/apiRoutes";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate the caller
    const user = await authenticateUser(req);
    const resumeId = params.id;

    // 2. Parse new name from body
    const body = await req.json();
    const newName: string | undefined = body.display_name;
    if (!newName || !newName.trim()) {
      return NextResponse.json(
        { success: false, error: "display_name is required" },
        { status: 400 }
      );
    }

    // 3. Verify the resume belongs to the authenticated user
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("resumes")
      .select("id, user_id")
      .eq("id", resumeId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: "CV introuvable" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    // 4. Update display_name using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from("resumes")
      .update({ display_name: newName.trim() })
      .eq("id", resumeId);

    if (updateError) {
      console.error("Error updating display_name:", updateError.message);
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 500);
  }
}
