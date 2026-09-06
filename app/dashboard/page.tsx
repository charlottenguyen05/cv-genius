"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  FolderOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import useUserStatus from "@/lib/hooks/useUserStatus";
import {
  getResumesByUser,
  getPdfPublicUrl,
  deleteResume,
} from "@/lib/supabase/client";

interface Resume {
  id: string;
  user_id: string | null;
  title: string;
  generated_content: string;
  created_at: string;
  display_name?: string | null;
  language?: string | null;
}

/** Extract a human-readable name from the file-path title stored in the DB */
function extractCVName(title: string): string {
  // title format: "{userId}/CV_{Name}__{random}_{timestamp}.pdf"
  const filename = title.split("/").pop() || title;
  const match = filename.match(/^CV_(.+?)__\d+_\d+\.pdf$/);
  if (match) {
    return match[1].replace(/_/g, " ");
  }
  // Fallback: strip extension
  return filename.replace(/\.pdf$/i, "");
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUserStatus();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch resumes
  const fetchResumes = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const data = await getResumesByUser(user.id);
      setResumes(data || []);
    } catch (err) {
      console.error("Error loading resumes:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de vos CVs"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchResumes();
  }, [user, fetchResumes]);

  // Download handler
  const handleDownload = (resume: Resume) => {
    const url = getPdfPublicUrl(resume.generated_content);
    const link = document.createElement("a");
    link.href = url;
    link.download = resume.title.split("/").pop() || "cv.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete handler
  const handleDelete = async (resume: Resume) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ce CV ?\n\n"${extractCVName(resume.title)}"\n\nCette action est irréversible.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(resume.id);
      await deleteResume(resume.id, resume.generated_content);
      setResumes((prev) => prev.filter((r) => r.id !== resume.id));
      setToast({ message: "CV supprimé avec succès", type: "success" });
    } catch (err) {
      console.error("Error deleting resume:", err);
      setToast({
        message:
          err instanceof Error ? err.message : "Erreur lors de la suppression",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Format date in French locale
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─── Loading state ───
  if (authLoading || (user && loading)) {
    return (
      <div
        className="min-h-screen bg-surface-tint flex items-center justify-center relative overflow-hidden"
        data-testid="dashboard-loading"
      >
        <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
          <p className="text-gray-600 text-lg font-medium">Chargement de vos CVs…</p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div
        className="min-h-screen bg-surface-tint flex items-center justify-center relative overflow-hidden"
        data-testid="dashboard-error"
      >
        <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
        <div className="relative z-10 max-w-md mx-auto text-center bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button
            onClick={fetchResumes}
            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full transition-all duration-200 shadow-sm"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // ─── Main dashboard ───
  return (
    <div
      className="min-h-screen bg-surface-tint relative overflow-hidden py-10"
      data-testid="dashboard-page"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hero-glow pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
          <div>
            <p className="section-label mb-2">// Mon Espace //</p>
            <h1
              className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight"
              data-testid="dashboard-title"
            >
              Mes CVs
            </h1>
            <p className="text-gray-500 text-lg mt-1" data-testid="dashboard-subtitle">
              Retrouvez et gérez tous vos CVs générés par l&apos;IA
            </p>
          </div>
          <Link
            href="/create"
            className="btn-primary text-base px-6 py-3 self-start sm:self-auto"
            data-testid="create-cv-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un nouveau CV
          </Link>
        </div>

        {/* ── Empty state ── */}
        {resumes.length === 0 ? (
          <div
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center"
            data-testid="dashboard-empty"
          >
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Aucun CV pour l&apos;instant
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Vous n&apos;avez pas encore généré de CV. Créez votre premier CV
              optimisé par l&apos;IA en quelques minutes !
            </p>
            <Link
              href="/create"
              className="btn-primary text-lg px-8 py-4"
              data-testid="empty-create-button"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Créer mon premier CV
            </Link>
          </div>
        ) : (
          <>
            {/* ── Stats bar ── */}
            <div
              className="bg-dark-card rounded-2xl p-4 mb-8 flex items-center gap-3"
              data-testid="dashboard-stats"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-300" />
              </div>
              <span className="text-white font-medium">
                {resumes.length} CV{resumes.length > 1 ? "s" : ""} généré
                {resumes.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Card grid ── */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-testid="dashboard-grid"
            >
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
                  data-testid={`cv-card-${resume.id}`}
                >
                  {/* Card top accent */}
                  <div className="h-1.5 bg-gradient-to-r from-primary-400 to-primary-600" />

                  {/* Card body */}
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Icon + title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors shrink-0">
                        <FileText className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-lg font-bold text-gray-900 truncate"
                            title={resume.display_name?.trim() || extractCVName(resume.title)}
                          >
                            {resume.display_name?.trim() || extractCVName(resume.title)}
                          </h3>
                          {resume.language && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                                resume.language === 'fr'
                                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                              data-testid={`language-badge-${resume.id}`}
                            >
                              {resume.language === 'fr' ? 'FR' : 'EN'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(resume.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() =>
                          router.push(`/preview/${resume.id}`)
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors"
                        data-testid={`preview-btn-${resume.id}`}
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </Button>
                      <Button
                        onClick={() => handleDownload(resume)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-dark-card/10 text-dark-card rounded-xl hover:bg-dark-card/20 transition-colors"
                        data-testid={`download-btn-${resume.id}`}
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </Button>
                      <Button
                        onClick={() => handleDelete(resume)}
                        disabled={deletingId === resume.id}
                        className="inline-flex items-center justify-center p-2 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                        data-testid={`delete-btn-${resume.id}`}
                      >
                        {deletingId === resume.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
