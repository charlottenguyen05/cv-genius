# Clean Code Practices Guide for CV-Genius

## Table of Contents
1. [Introduction](#introduction)
2. [Single Responsibility Principle](#single-responsibility-principle)
3. [Function Design](#function-design)
4. [Component Organization](#component-organization)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Naming Conventions](#naming-conventions)
8. [Code Organization](#code-organization)
9. [Testing Considerations](#testing-considerations)
10. [Before/After Examples](#beforeafter-examples)

## Introduction

Clean code is about writing code that is **readable**, **maintainable**, and **extensible**. This guide uses examples from our CV-Genius project to teach clean coding practices.

### Why Clean Code Matters
- **Reduces bugs** - Clear code has fewer hiding places for bugs
- **Faster development** - Teams work faster on clean codebases
- **Easier maintenance** - Changes become safer and simpler
- **Better collaboration** - Code reviews become meaningful discussions

## Single Responsibility Principle

**Rule**: Each function, class, or component should have one reason to change.

### ❌ Bad Example from CVGenerationModal.tsx
```typescript
// This component does EVERYTHING:
// - UI rendering
// - API calls
// - State management
// - Business logic
// - Error handling
export default function CVGenerationModal({
  isOpen,
  onClose,
  onComplete,
  cvData,
}: CVGenerationModalProps) {
  // 15+ useState calls
  const [steps, setSteps] = useState<GenerationStep[]>([...]);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [currentAiStep, setCurrentAiStep] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  // ... more state

  // 100+ line method doing multiple things
  const startGeneration = async () => {
    // Validation logic
    // API calls
    // State updates
    // Error handling
    // PDF generation
  };

  return (
    // 200+ lines of JSX
  );
}
```

### ✅ Good Example - Separation of Concerns
```typescript
// 1. Custom hook for business logic
const useCVGeneration = (cvData: CVFormData) => {
  // All generation logic here
};

// 2. Service for API calls
class CVGenerationService {
  async improveCV(cvData: CVFormData) { /* ... */ }
  async generatePDF(cvData: CVFormData) { /* ... */ }
}

// 3. Component only handles UI
export function CVGenerationModal({ isOpen, onClose, cvData }) {
  const { steps, isGenerating, error, generateCV } = useCVGeneration(cvData);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <GenerationSteps steps={steps} />
      <ErrorDisplay error={error} />
      <ActionButtons onGenerate={generateCV} />
    </Modal>
  );
}
```

## Function Design

### Keep Functions Small
**Rule**: Functions should do one thing and do it well. Aim for 20 lines or fewer.

### ❌ Bad Example
```typescript
// From useCVForm.ts - This could be broken down
const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
  const updatedExperiences = [...formData.experiences];
  updatedExperiences[index] = {
    ...updatedExperiences[index],
    [field]: value,
  };
  setFormData({
    ...formData,
    experiences: updatedExperiences,
  });
};
```

### ✅ Good Example
```typescript
// Break it into smaller, focused functions
const updateArrayItem = <T>(array: T[], index: number, updates: Partial<T>): T[] => {
  return array.map((item, i) => 
    i === index ? { ...item, ...updates } : item
  );
};

const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
  const updates = { [field]: value };
  const updatedExperiences = updateArrayItem(formData.experiences, index, updates);
  
  setFormData(prev => ({
    ...prev,
    experiences: updatedExperiences
  }));
};
```

### Use Meaningful Function Names

### ❌ Bad
```typescript
const simulateAIStreaming = (text: string) => { /* ... */ }
const updateStepStatus = (stepId: string, status: GenerationStep["status"], details?: string) => { /* ... */ }
```

### ✅ Good
```typescript
const animateTextWithTypingEffect = (text: string) => { /* ... */ }
const setGenerationStepStatus = (stepId: string, status: GenerationStep["status"], details?: string) => { /* ... */ }
```

## Component Organization

### Component Structure Template
```typescript
// 1. Imports (external libraries first, then internal)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useCVForm } from '@/lib/hooks/useCVForm';

// 2. Types and interfaces
interface ComponentProps {
  title: string;
  onSave: (data: FormData) => void;
}

// 3. Constants
const DEFAULT_VALUES = {
  timeout: 5000,
  retries: 3,
};

// 4. Helper functions (consider moving to utils if reused)
const validateInput = (value: string): boolean => {
  return value.length > 0;
};

// 5. Main component
export function MyComponent({ title, onSave }: ComponentProps) {
  // 6. Hooks (useState, useEffect, custom hooks)
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateField } = useCVForm();
  
  // 7. Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission
  };
  
  // 8. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 9. Early returns for conditional rendering
  if (!title) return null;
  
  // 10. Main render
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### Extract Sub-components

### ❌ Bad - Monolithic Component
```typescript
// CVGenerationModal.tsx (474 lines)
export default function CVGenerationModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          {/* 50+ lines of header JSX */}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Steps Progress */}
          <div className="space-y-4 mb-6">
            {/* 100+ lines of steps JSX */}
          </div>
          
          {/* Success Actions */}
          {/* 50+ lines of success JSX */}
          
          {/* Error Display */}
          {/* 30+ lines of error JSX */}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          {/* 30+ lines of footer JSX */}
        </div>
      </div>
    </div>
  );
}
```

### ✅ Good - Composed Components
```typescript
// CVGenerationModal.tsx (50 lines)
export function CVGenerationModal({ isOpen, onClose, cvData }: Props) {
  const generation = useCVGeneration(cvData);
  
  if (!isOpen) return null;
  
  return (
    <Modal>
      <ModalHeader 
        title="Génération de votre CV" 
        onClose={onClose}
        isGenerating={generation.isInProgress}
      />
      <ModalContent>
        <GenerationProgress steps={generation.steps} />
        <AIResponseDisplay response={generation.aiResponse} />
        <GenerationActions 
          onRetry={generation.retry}
          onPreview={generation.openPreview}
          error={generation.error}
          isComplete={generation.isComplete}
        />
      </ModalContent>
      <ModalFooter status={generation.status} />
    </Modal>
  );
}
```

## State Management

### Consolidate Related State

### ❌ Bad - Scattered State
```typescript
// From CVGenerationModal.tsx
const [aiResponse, setAiResponse] = useState<string>("");
const [currentAiStep, setCurrentAiStep] = useState<string>("");
const [isGenerating, setIsGenerating] = useState(false);
const [error, setError] = useState<string>("");
const [resumeId, setResumeId] = useState<string>("");
const [isCompleted, setIsCompleted] = useState(false);
```

### ✅ Good - Consolidated State
```typescript
interface GenerationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  aiResponse: string;
  currentStep: string;
  error: string | null;
  resumeId: string | null;
}

const [generationState, setGenerationState] = useState<GenerationState>({
  status: 'idle',
  aiResponse: '',
  currentStep: '',
  error: null,
  resumeId: null,
});

// Helper functions for state updates
const setGenerating = (step: string) => {
  setGenerationState(prev => ({
    ...prev,
    status: 'generating',
    currentStep: step,
    error: null,
  }));
};
```

### Use Custom Hooks for Complex Logic

### ✅ Example - Extracted Hook
```typescript
// hooks/useCVGeneration.ts
export function useCVGeneration(cvData: CVFormData) {
  const [state, setState] = useState<GenerationState>(initialState);
  const service = useMemo(() => new CVGenerationService(), []);
  
  const generateCV = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, status: 'generating' }));
      
      // Step 1: Validate
      const validation = service.validateCVData(cvData);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Step 2: Improve with AI
      const improved = await service.improveCV(cvData);
      
      // Step 3: Generate PDF
      const pdf = await service.generatePDF(improved.data);
      
      setState(prev => ({
        ...prev,
        status: 'completed',
        resumeId: pdf.resumeId,
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    }
  }, [cvData, service]);
  
  return {
    ...state,
    generateCV,
    retry: generateCV,
  };
}
```

## Error Handling

### Create Consistent Error Boundaries

### ❌ Bad - Inconsistent Error Handling
```typescript
// Different error handling patterns throughout the app
try {
  const response = await fetch('/api/cv/generate');
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Erreur lors de la génération PDF");
  }
} catch (error) {
  setError(error instanceof Error ? error.message : "Erreur inconnue");
}
```

### ✅ Good - Consistent Error Service
```typescript
// services/errorService.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR');
  }
  
  return new AppError('Une erreur inattendue s\'est produite', 'UNKNOWN_ERROR');
};

// Usage in components
try {
  const result = await apiCall();
} catch (error) {
  const appError = handleApiError(error);
  setError(appError.message);
  
  // Optional: Log to monitoring service
  logger.error(appError);
}
```

## Naming Conventions

### Use Domain Language

### ❌ Bad - Technical Names
```typescript
const data = await fetch('/api/cv/complete-improve');
const result = data.json();
const obj = result.improvedCV;
```

### ✅ Good - Domain Names
```typescript
const improveResponse = await fetch('/api/cv/complete-improve');
const improvementResult = await improveResponse.json();
const enhancedCV = improvementResult.improvedCV;
```

### Boolean Variables

### ❌ Bad
```typescript
const generate = true;
const complete = false;
const error = true;
```

### ✅ Good
```typescript
const isGenerating = true;
const hasCompleted = false;
const hasError = true;
```

### Function Names Should Be Verbs

### ❌ Bad
```typescript
const validation = (cvData) => { /* ... */ };
const improvement = (cvData) => { /* ... */ };
```

### ✅ Good
```typescript
const validateCVData = (cvData) => { /* ... */ };
const improveCVWithAI = (cvData) => { /* ... */ };
```

## Code Organization

### File Structure by Feature
```
components/
  cv-generation/
    CVGenerationModal.tsx
    GenerationProgress.tsx
    GenerationActions.tsx
    AIResponseDisplay.tsx
    hooks/
      useCVGeneration.ts
    services/
      cvGenerationService.ts
    types/
      generation.types.ts
```

### Barrel Exports
```typescript
// components/cv-generation/index.ts
export { CVGenerationModal } from './CVGenerationModal';
export { GenerationProgress } from './GenerationProgress';
export { useCVGeneration } from './hooks/useCVGeneration';
```

## Testing Considerations

### Write Testable Code

### ❌ Hard to Test
```typescript
const CVGenerationModal = () => {
  const [state, setState] = useState(initialState);
  
  const startGeneration = async () => {
    // 100+ lines of mixed logic
    // API calls, state updates, UI logic all mixed
  };
  
  useEffect(() => {
    if (isOpen && cvData && !isGenerating) {
      startGeneration(); // Hard to test this interaction
    }
  }, [isOpen, cvData]);
  
  return (/* complex JSX */);
};
```

### ✅ Easy to Test
```typescript
// 1. Testable hook
export function useCVGeneration(cvData: CVFormData) {
  // Pure business logic, easy to test
}

// 2. Testable service
export class CVGenerationService {
  // Each method is testable in isolation
}

// 3. Simple component
export function CVGenerationModal({ isOpen, onClose, cvData }) {
  const generation = useCVGeneration(cvData);
  
  // Simple component, easy to test UI interactions
  return <div>...</div>;
}
```

## Before/After Examples

### Example 1: CVGenerationModal Refactoring

#### Before (Current Code - 474 lines)
- Single component handling everything
- Mixed UI and business logic
- Hard to test
- Difficult to maintain

#### After (Clean Code - Multiple focused files)
```typescript
// CVGenerationModal.tsx (50 lines)
export function CVGenerationModal({ isOpen, onClose, cvData }) {
  const generation = useCVGeneration(cvData);
  
  return (
    <GenerationModalLayout
      isOpen={isOpen}
      onClose={onClose}
      isGenerating={generation.isInProgress}
    >
      <GenerationSteps steps={generation.steps} />
      <AIResponseDisplay response={generation.aiResponse} />
      <GenerationActions generation={generation} />
    </GenerationModalLayout>
  );
}

// hooks/useCVGeneration.ts (80 lines)
export function useCVGeneration(cvData: CVFormData) {
  // All business logic
}

// services/CVGenerationService.ts (60 lines)
export class CVGenerationService {
  // All API interactions
}
```

### Benefits of Refactoring:
1. **Single Responsibility** - Each file has one purpose
2. **Testability** - Each piece can be tested independently
3. **Reusability** - Hooks and services can be reused
4. **Maintainability** - Easier to understand and modify
5. **Debugging** - Easier to isolate issues

## Key Takeaways

1. **Start Small** - Refactor one function at a time
2. **Extract Logic** - Move business logic to hooks or services
3. **Compose Components** - Break large components into smaller ones
4. **Name Things Well** - Use domain language and clear intent
5. **Test Early** - Write testable code from the start
6. **Be Consistent** - Establish patterns and stick to them

Remember: Clean code is not about perfection, it's about **clarity** and **maintainability**. Every small improvement counts!