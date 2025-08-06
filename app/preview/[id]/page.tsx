"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getResumeById, getPdfPublicUrl } from "@/lib/supabase/client";
import { ArrowLeft, Download, AlertCircle, Loader2 } from "lucide-react";
import useUserStatus from "@/lib/hooks/useUserStatus";

interface Resume {
  id: string;
  user_id: string | null;
  title: string;
  generated_content: string;
  created_at: string;
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

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
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="preview-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                data-testid="back-button"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900" data-testid="resume-title">
                  Votre CV Améliorée
                </h1>
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Chargement du PDF...</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center space-x-4" data-testid="preview-actions">
          <Button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un nouveau CV
          </Button>
          <Button
            onClick={handleDownload}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger ce CV
          </Button>
        </div>
      </div>
    </div>
  );
}