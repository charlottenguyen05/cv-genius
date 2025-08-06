import { CVFormData } from ".";

// Types specific to CV generation process
export type GenerationStepId =
  | "validation"
  | "ai-improvement"
  | "pdf-generation";
export type GenerationStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "error";

export interface GenerationStep {
  id: GenerationStepId;
  label: string;
  status: GenerationStepStatus;
  icon?: any;
  details?: string;
}

export interface CVGenerationState {
  steps: GenerationStep[];
  aiResponse: string;
  currentAiStep: string;
  isGenerating: boolean;
  error: CVGenerationError | null;
  resumeId: string | null;
  isCompleted: boolean;
}

export interface CVGenerationCallbacks {
  onComplete?: (pdfBlob: Blob, filename: string, resumeId?: string) => void;
  onClose: () => void;
}

export interface CVGenerationModalProps extends CVGenerationCallbacks {
  isOpen: boolean;
  cvData: CVFormData;
}

export interface GenerationResult {
  success: boolean;
  resumeId?: string;
  filename?: string;
  error?: string;
}

export interface CVGenerationError {
  message: string;
  code?: string;
  step?: GenerationStepId;
  details?: string;
  timestamp?: Date;
}

export interface AIStreamingConfig {
  text: string;
  intervalMs: number;
}

export type CVGenerationAction =
  | {
      type: "PROCESS_SUCCESS";
      payload: {
        resumeId: string | null;
        isCompleted: boolean;
        stepId: GenerationStepId;
        status: GenerationStepStatus;
        details: string;
        stepContent: string;
      };
    }
  | { type: "RESET" }
  | {
      type: "PROCESS_START";
      payload: {
        stepId: GenerationStepId;
        status: GenerationStepStatus;
        stepContent: string;
      };
    }
  | {
      type: "SET_STEP_STATUS";
      payload: {
        stepId: string;
        status: GenerationStep["status"];
        details?: string;
      };
    }
  | { type: "SET_ERROR"; payload: { error: CVGenerationError | null } }
  | { type: "SET_IS_GENERATING"; payload: { isGenerating: boolean } }
  | { type: "SET_AI_RESPONSE"; payload: { aiResponse: string } }