"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getResumeById, getPdfPublicUrl, updateResumeDisplayName } from "@/lib/supabase/client";
import { ArrowLeft, Download, AlertCircle, Loader2, Pencil, Check, X } from "lucide-react";
import useUserStatus from "@/lib/hooks/useUserStatus";

interface Resume {
  id: string;
  user_id: string | null;
  title: string;
  generated_content: string;
  created_at: string;
  display_name?: string | null;
  language?: string | null;
}

/** Extract a human-readable name from the file-path stored in `title` */
function extractCVName(title: string): string {
  const filename = title.split("/").pop() || title;
  const match = filename.match(/^CV_(.+?)__\d+_\d+\.pdf$/);
  if (match) return match[1].replace(/_/g, " ");
  return filename.replace(/\.pdf$/i, "");
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  const { user, isLoading } = useUserStatus();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      if (!resumeId || !user) return;

      if (!resumeId) {
        setError("ID du CV manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch resume data from database
        const resumeData = await getResumeById(resumeId);
        setResume(resumeData);

        // Add user authorization check
        if (resumeData.user_id !== user.id) {
          setError("Vous n'avez pas l'autorisation d'accéder à ce CV");
          return;
        }

        // Get public URL for the PDF
        const publicUrl = getPdfPublicUrl(resumeData.generated_content);
        setPdfUrl(publicUrl);
      } catch (err) {
        console.error("Error loading resume:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du CV");
      } finally {
        setLoading(false);
      }
    };

    if (user) loadResume();
  }, [resumeId, user]);

  /** Displayed name: prefer display_name, fall back to extractCVName */
  const displayName = (resume?.display_name?.trim()) || (resume ? extractCVName(resume.title) : "");

  const startEditing = () => {
    setEditName(displayName);
    setSaveError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError("");
  };

  const saveName = async () => {
    if (!resume) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      setSaveError("");
      await updateResumeDisplayName(resume.id, trimmed);
      setResume((prev) => prev ? { ...prev, display_name: trimmed } : prev);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl && resume) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = resume.title;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du CV...</p>
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center" data-testid="error-state">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Le CV demandé est introuvable."}
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="btn-primary px-6 py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-tint" data-testid="preview-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="btn-primary flex items-center space-x-2 px-4 py-2"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                {/* Inline-editable CV name */}
                {isEditing ? (
                  <div className="flex items-center gap-2" data-testid="resume-name-editor">
                    <input
                      autoFocus
                      id="resume-name-input"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="text-xl font-semibold text-gray-900 border-b-2 border-primary-400 bg-transparent outline-none px-1 min-w-[200px]"
                      data-testid="resume-name-input"
                    />
                    <button
                      onClick={saveName}
                      disabled={saving || !editName.trim()}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                      title="Enregistrer"
                      data-testid="save-name-button"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Annuler"
                      data-testid="cancel-name-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {saveError && (
                      <span className="text-xs text-red-500 ml-1">{saveError}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1
                      className="text-xl font-semibold text-gray-900"
                      data-testid="resume-title"
                    >
                      {displayName}
                    </h1>
                    <button
                      onClick={startEditing}
                      className="p-1 text-gray-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Renommer le CV"
                      data-testid="edit-name-button"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500" data-testid="resume-date">
                  Généré le {new Date(resume.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownload}
              className="btn-primary flex items-center space-x-2 px-4 py-2"
              data-testid="download-button"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid="pdf-container">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-[800px] border-0"
              title="Aperçu du CV"
              data-testid="pdf-viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-96" data-testid="pdf-loading">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                <p className="text-gray-600">Chargement du PDF...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}