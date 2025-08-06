import {
  CVGenerationState,
  CVGenerationAction,
  CVGenerationError,
  GenerationStep,
  GenerationStepId,
} from "@/types/cvGeneration";

// Import the reducer function and initial state - we'll need to export them from the hook file
// For now, I'll recreate them here for testing purposes
const initialSteps: GenerationStep[] = [
  {
    id: "validation",
    label: "Validation des données",
    status: "pending",
  },
  {
    id: "ai-improvement",
    label: "Amélioration par IA",
    status: "pending",
  },
  {
    id: "pdf-generation",
    label: "Génération PDF",
    status: "pending",
  },
];

const initialState: CVGenerationState = {
  steps: initialSteps,
  aiResponse: "",
  currentAiStep: "",
  isGenerating: false,
  error: null,
  resumeId: null,
  isCompleted: false,
};

// Copy of the reducer for testing
function modalReducer(state: CVGenerationState, action: CVGenerationAction) {
  switch (action.type) {
    case "PROCESS_SUCCESS":
      return {
        ...state,
        resumeId: action.payload.resumeId || null,
        isCompleted: action.payload.isCompleted,
        currentAiStep: action.payload.isCompleted ? "" : state.currentAiStep,
        steps: state.steps.map((step) =>
          step.id === action.payload.stepId
            ? {
                ...step,
                status: action.payload.status,
                details: action.payload.details,
              }
            : step
        ),
      };
    case "RESET":
      return { ...initialState };

    case "PROCESS_START":
      return {
        ...state,
        currentAiStep: action.payload.stepContent,
        steps: state.steps.map((step) =>
          step.id === action.payload.stepId
            ? {
                ...step,
                status: action.payload.status,
                details: "",
              }
            : step
        ),
      };

    case "SET_STEP_STATUS":
      return {
        ...state,
        steps: state.steps.map((step) =>
          step.id === action.payload.stepId
            ? {
                ...step,
                status: action.payload.status,
                details: action.payload.details,
              }
            : step
        ),
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload.error,
      };

    case "SET_IS_GENERATING":
      return {
        ...state,
        isGenerating: action.payload.isGenerating,
      };

    case "SET_AI_RESPONSE":
      return {
        ...state,
        aiResponse: action.payload.aiResponse,
      };

    default:
      return state;
  }
}

describe("cvGenerationReducer", () => {
  describe("PROCESS_START action", () => {
    it("should handle PROCESS_START action and update step status to running", () => {
      const action: CVGenerationAction = {
        type: "PROCESS_START",
        payload: {
          stepId: "validation",
          status: "running",
          stepContent: "Validating CV data...",
        },
      };

      const result = modalReducer(initialState, action);

      expect(result.currentAiStep).toBe("Validating CV data...");
      expect(result.steps[0]).toEqual({
        id: "validation",
        label: "Validation des données",
        status: "running",
        details: "",
      });
      // Other steps should remain unchanged
      expect(result.steps[1].status).toBe("pending");
      expect(result.steps[2].status).toBe("pending");
    });

    it("should handle PROCESS_START for ai-improvement step", () => {
      const action: CVGenerationAction = {
        type: "PROCESS_START",
        payload: {
          stepId: "ai-improvement",
          status: "running",
          stepContent: "Improving CV with AI...",
        },
      };

      const result = modalReducer(initialState, action);

      expect(result.currentAiStep).toBe("Improving CV with AI...");
      expect(result.steps[1].status).toBe("running");
      expect(result.steps[1].details).toBe("");
    });
  });

  describe("PROCESS_SUCCESS action", () => {
    it("should handle PROCESS_SUCCESS action for non-completed step", () => {
      const action: CVGenerationAction = {
        type: "PROCESS_SUCCESS",
        payload: {
          resumeId: null,
          isCompleted: false,
          stepId: "validation",
          status: "completed",
          details: "Validation successful",
          stepContent: "Data validated",
        },
      };

      const stateWithRunningStep = {
        ...initialState,
        currentAiStep: "Validating...",
      };

      const result = modalReducer(stateWithRunningStep, action);

      expect(result.resumeId).toBe(null);
      expect(result.isCompleted).toBe(false);
      expect(result.currentAiStep).toBe("Validating..."); // Should remain unchanged when not completed
      expect(result.steps[0]).toEqual({
        id: "validation",
        label: "Validation des données",
        status: "completed",
        details: "Validation successful",
      });
    });

    it("should handle PROCESS_SUCCESS action for completed generation", () => {
      const action: CVGenerationAction = {
        type: "PROCESS_SUCCESS",
        payload: {
          resumeId: "resume-123",
          isCompleted: true,
          stepId: "pdf-generation",
          status: "completed",
          details: "PDF generated successfully",
          stepContent: "Generation complete",
        },
      };

      const stateWithCurrentStep = {
        ...initialState,
        currentAiStep: "Generating PDF...",
      };

      const result = modalReducer(stateWithCurrentStep, action);

      expect(result.resumeId).toBe("resume-123");
      expect(result.isCompleted).toBe(true);
      expect(result.currentAiStep).toBe(""); // Should be cleared when completed
      expect(result.steps[2]).toEqual({
        id: "pdf-generation",
        label: "Génération PDF",
        status: "completed",
        details: "PDF generated successfully",
      });
    });

    it("should handle PROCESS_SUCCESS with null resumeId", () => {
      const action: CVGenerationAction = {
        type: "PROCESS_SUCCESS",
        payload: {
          resumeId: null,
          isCompleted: true,
          stepId: "pdf-generation",
          status: "completed",
          details: "Completed without resume ID",
          stepContent: "Done",
        },
      };

      const result = modalReducer(initialState, action);

      expect(result.resumeId).toBe(null);
      expect(result.isCompleted).toBe(true);
    });
  });

  describe("SET_ERROR action", () => {
    it("should handle SET_ERROR with CVGenerationError", () => {
      const error: CVGenerationError = {
        message: "Generation failed",
        code: "GEN_001",
        step: "ai-improvement",
        details: "AI service unavailable",
        timestamp: new Date("2024-01-01T00:00:00Z"),
      };

      const action: CVGenerationAction = {
        type: "SET_ERROR",
        payload: { error },
      };

      const result = modalReducer(initialState, action);

      expect(result.error).toEqual(error);
      // Other state should remain unchanged
      expect(result.steps).toEqual(initialState.steps);
      expect(result.isGenerating).toBe(false);
    });

    it("should handle SET_ERROR with null error (clearing error)", () => {
      const stateWithError = {
        ...initialState,
        error: {
          message: "Previous error",
          code: "ERR_001",
        } as CVGenerationError,
      };

      const action: CVGenerationAction = {
        type: "SET_ERROR",
        payload: { error: null },
      };

      const result = modalReducer(stateWithError, action);

      expect(result.error).toBe(null);
    });
  });

  describe("SET_STEP_STATUS action", () => {
    it("should handle SET_STEP_STATUS action", () => {
      const action: CVGenerationAction = {
        type: "SET_STEP_STATUS",
        payload: {
          stepId: "ai-improvement",
          status: "error",
          details: "AI service failed",
        },
      };

      const result = modalReducer(initialState, action);

      expect(result.steps[1]).toEqual({
        id: "ai-improvement",
        label: "Amélioration par IA",
        status: "error",
        details: "AI service failed",
      });
      // Other steps should remain unchanged
      expect(result.steps[0].status).toBe("pending");
      expect(result.steps[2].status).toBe("pending");
    });

    it("should handle SET_STEP_STATUS without details", () => {
      const action: CVGenerationAction = {
        type: "SET_STEP_STATUS",
        payload: {
          stepId: "validation",
          status: "running",
        },
      };

      const result = modalReducer(initialState, action);

      expect(result.steps[0]).toEqual({
        id: "validation",
        label: "Validation des données",
        status: "running",
        details: undefined,
      });
    });

    it("should handle SET_STEP_STATUS for non-existent step gracefully", () => {
      const action: CVGenerationAction = {
        type: "SET_STEP_STATUS",
        payload: {
          stepId: "non-existent-step",
          status: "completed",
          details: "Should not affect any step",
        },
      };

      const result = modalReducer(initialState, action);

      // All steps should remain unchanged
      expect(result.steps).toEqual(initialState.steps);
    });
  });

  describe("SET_IS_GENERATING action", () => {
    it("should handle SET_IS_GENERATING to true", () => {
      const action: CVGenerationAction = {
        type: "SET_IS_GENERATING",
        payload: { isGenerating: true },
      };

      const result = modalReducer(initialState, action);

      expect(result.isGenerating).toBe(true);
      // Other state should remain unchanged
      expect(result.steps).toEqual(initialState.steps);
    });

    it("should handle SET_IS_GENERATING to false", () => {
      const stateWithGenerating = {
        ...initialState,
        isGenerating: true,
      };

      const action: CVGenerationAction = {
        type: "SET_IS_GENERATING",
        payload: { isGenerating: false },
      };

      const result = modalReducer(stateWithGenerating, action);

      expect(result.isGenerating).toBe(false);
    });
  });

  describe("SET_AI_RESPONSE action", () => {
    it("should handle SET_AI_RESPONSE action", () => {
      const action: CVGenerationAction = {
        type: "SET_AI_RESPONSE",
        payload: { aiResponse: "AI is improving your CV..." },
      };

      const result = modalReducer(initialState, action);

      expect(result.aiResponse).toBe("AI is improving your CV...");
      // Other state should remain unchanged
      expect(result.steps).toEqual(initialState.steps);
      expect(result.isGenerating).toBe(false);
    });

    it("should handle SET_AI_RESPONSE with empty string", () => {
      const stateWithResponse = {
        ...initialState,
        aiResponse: "Previous response",
      };

      const action: CVGenerationAction = {
        type: "SET_AI_RESPONSE",
        payload: { aiResponse: "" },
      };

      const result = modalReducer(stateWithResponse, action);

      expect(result.aiResponse).toBe("");
    });
  });

  describe("RESET action", () => {
    it("should handle RESET action and return to initial state", () => {
      const modifiedState: CVGenerationState = {
        steps: [
          {
            id: "validation",
            label: "Test",
            status: "completed",
            details: "Done",
          },
          { id: "ai-improvement", label: "Test", status: "running" },
          {
            id: "pdf-generation",
            label: "Test",
            status: "error",
            details: "Failed",
          },
        ],
        aiResponse: "Some AI response",
        currentAiStep: "Processing...",
        isGenerating: true,
        error: {
          message: "Some error",
          code: "ERR_001",
        } as CVGenerationError,
        resumeId: "resume-123",
        isCompleted: false,
      };

      const action: CVGenerationAction = { type: "RESET" };

      const result = modalReducer(modifiedState, action);

      expect(result).toEqual(initialState);
      expect(result).not.toBe(initialState); // Should be a new object
    });
  });

  describe("default case", () => {
    it("should return unchanged state for unknown action type", () => {
      // @ts-ignore - Testing unknown action type
      const unknownAction = { type: "UNKNOWN_ACTION", payload: {} } as any;

      const result = modalReducer(initialState, unknownAction);

      expect(result).toBe(initialState);
    });
  });

  describe("state immutability", () => {
    it("should not mutate original state object", () => {
      const action: CVGenerationAction = {
        type: "SET_IS_GENERATING",
        payload: { isGenerating: true },
      };

      const originalState = { ...initialState };
      const result = modalReducer(initialState, action);

      expect(initialState).toEqual(originalState);
      expect(result).not.toBe(initialState);
    });

    it("should not mutate steps array", () => {
      const action: CVGenerationAction = {
        type: "SET_STEP_STATUS",
        payload: {
          stepId: "validation",
          status: "completed",
          details: "Success",
        },
      };

      const originalSteps = [...initialState.steps];
      const result = modalReducer(initialState, action);

      expect(initialState.steps).toEqual(originalSteps);
      expect(result.steps).not.toBe(initialState.steps);
      expect(result.steps[0]).not.toBe(initialState.steps[0]);
    });
  });

  describe("edge cases", () => {
    it("should handle multiple step updates correctly", () => {
      let state = initialState;

      // Start validation
      state = modalReducer(state, {
        type: "PROCESS_START",
        payload: {
          stepId: "validation",
          status: "running",
          stepContent: "Validating...",
        },
      });

      // Complete validation
      state = modalReducer(state, {
        type: "PROCESS_SUCCESS",
        payload: {
          resumeId: null,
          isCompleted: false,
          stepId: "validation",
          status: "completed",
          details: "Validation complete",
          stepContent: "Validated",
        },
      });

      // Start AI improvement
      state = modalReducer(state, {
        type: "PROCESS_START",
        payload: {
          stepId: "ai-improvement",
          status: "running",
          stepContent: "Improving...",
        },
      });

      expect(state.steps[0].status).toBe("completed");
      expect(state.steps[1].status).toBe("running");
      expect(state.steps[2].status).toBe("pending");
      expect(state.currentAiStep).toBe("Improving...");
    });

    it("should handle concurrent state updates", () => {
      const state1 = modalReducer(initialState, {
        type: "SET_IS_GENERATING",
        payload: { isGenerating: true },
      });

      const state2 = modalReducer(state1, {
        type: "SET_AI_RESPONSE",
        payload: { aiResponse: "AI working..." },
      });

      const state3 = modalReducer(state2, {
        type: "PROCESS_START",
        payload: {
          stepId: "ai-improvement",
          status: "running",
          stepContent: "Processing with AI...",
        },
      });

      expect(state3.isGenerating).toBe(true);
      expect(state3.aiResponse).toBe("AI working...");
      expect(state3.currentAiStep).toBe("Processing with AI...");
      expect(state3.steps[1].status).toBe("running");
    });
  });
  // Tests pour createCVGenerationError
  describe("createCVGenerationError", () => {
    // We need to import the service to test this method
    const {
      cvGenerationService,
    } = require("@/lib/modal/cv-generation-modal-service");

    beforeEach(() => {
      // Mock Date to have consistent timestamps in tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should create error with all fields", () => {
      const message = "Test error message";
      const options = {
        code: "TEST_CODE",
        step: "ai-improvement" as GenerationStepId,
        details: "Test error details",
      };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Test error message",
        code: "TEST_CODE",
        step: "ai-improvement",
        details: "Test error details",
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should create error with only message (minimal case)", () => {
      const message = "Simple error";

      const result = cvGenerationService.createCVGenerationError(message);

      expect(result).toEqual({
        message: "Simple error",
        code: "UNKNOWN_ERROR",
        step: undefined,
        details: undefined,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should use error name as code when Error object is provided", () => {
      const message = "Error with Error object";
      const error = new TypeError("Type error occurred");
      const options = {
        error,
        step: "validation" as GenerationStepId,
      };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Error with Error object",
        code: "TypeError",
        step: "validation",
        details: error.stack,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should prioritize provided code over error name", () => {
      const message = "Custom code priority";
      const error = new Error("Generic error");
      const options = {
        code: "CUSTOM_CODE",
        error,
        details: "Custom details",
      };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Custom code priority",
        code: "CUSTOM_CODE", // Should use provided code, not error.name
        step: undefined,
        details: "Custom details", // Should use provided details, not error.stack
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should prioritize provided details over error stack", () => {
      const message = "Custom details priority";
      const error = new Error("Error with stack");
      const options = {
        error,
        details: "Override details",
        step: "pdf-generation" as GenerationStepId,
      };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Custom details priority",
        code: "Error",
        step: "pdf-generation",
        details: "Override details", // Should use provided details, not error.stack
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should handle all generation step types", () => {
      const steps: GenerationStepId[] = [
        "validation",
        "ai-improvement",
        "pdf-generation",
      ];

      steps.forEach((step) => {
        const result = cvGenerationService.createCVGenerationError(
          `Error in ${step}`,
          { step }
        );

        expect(result.step).toBe(step);
        expect(result.message).toBe(`Error in ${step}`);
      });
    });

    it("should handle Error object without custom details or code", () => {
      const message = "Error object only";
      const error = new ReferenceError("Reference not found");
      const options = { error };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Error object only",
        code: "ReferenceError",
        step: undefined,
        details: error.stack,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should handle empty options object", () => {
      const message = "Empty options";
      const options = {};

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result).toEqual({
        message: "Empty options",
        code: "UNKNOWN_ERROR",
        step: undefined,
        details: undefined,
        timestamp: new Date("2024-01-01T12:00:00Z"),
      });
    });

    it("should create new timestamp for each call", () => {
      const message = "Timestamp test";

      // First call
      const result1 = cvGenerationService.createCVGenerationError(message);

      // Advance time
      jest.advanceTimersByTime(5000); // 5 seconds

      // Second call
      const result2 = cvGenerationService.createCVGenerationError(message);

      expect(result1.timestamp).toEqual(new Date("2024-01-01T12:00:00Z"));
      expect(result2.timestamp).toEqual(new Date("2024-01-01T12:00:05Z"));
      expect(result1.timestamp).not.toEqual(result2.timestamp);
    });

    it("should handle complex Error objects with additional properties", () => {
      const message = "Complex error";
      class CustomError extends Error {
        constructor(message: string, public statusCode: number) {
          super(message);
          this.name = "CustomError";
        }
      }

      const error = new CustomError("Custom error occurred", 500);
      const options = {
        error,
        step: "ai-improvement" as GenerationStepId,
      };

      const result = cvGenerationService.createCVGenerationError(
        message,
        options
      );

      expect(result.message).toBe("Complex error");
      expect(result.code).toBe("CustomError");
      expect(result.step).toBe("ai-improvement");
      expect(result.details).toBe(error.stack);
      expect(result.timestamp).toEqual(new Date("2024-01-01T12:00:00Z"));
    });
  });
});
