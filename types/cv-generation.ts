import { CVContent } from ".";

// Types specific to CV generation process
export type GenerationStepId = 'validation' | 'ai-improvement' | 'pdf-generation';
export type GenerationStepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface GenerationStep {
  id: GenerationStepId;
  label: string;
  status: GenerationStepStatus;
  details?: string;
}

export interface CVGenerationState {
  steps: GenerationStep[];
  aiResponse: string;
  currentAiStep: string;
  isGenerating: boolean;
  error: string | null;
  resumeId: string | null;
  isCompleted: boolean;
}

export interface CVGenerationCallbacks {
  onComplete?: (pdfBlob: Blob, filename: string, resumeId?: string) => void;
  onClose: () => void;
}

export interface CVGenerationModalProps extends CVGenerationCallbacks {
  isOpen: boolean;
  cvData: CVContent;
}

export interface GenerationResult {
  success: boolean;
  resumeId?: string;
  filename?: string;
  error?: string;
}

export interface AIStreamingConfig {
  text: string;
  intervalMs: number;
} 