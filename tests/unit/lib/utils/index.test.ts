import {
  cn,
  validatePassword
} from "@/lib/utils/index";

describe("Utils Functions", () => {
  describe("cn", () => {
    test("combines simple class names", () => {
      expect(cn("btn", "primary")).toBe("btn primary");
    });

    test("handles conditional classes", () => {
      expect(cn("btn", true && "active", false && "disabled")).toBe("btn active");
    });

    test("merges conflicting Tailwind classes", () => {
      expect(cn("px-2", "px-4")).toBe("px-4");
    });

    test("handles arrays and objects", () => {
      expect(cn(["btn", "primary"], { active: true, disabled: false })).toBe("btn primary active");
    });

    test("handles empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("", undefined, null)).toBe("");
    });
  });
  
    describe("validatePassword", () => {
      test("validates strong password", () => {
        const result = validatePassword("StrongPass123");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
  
      test("rejects password too short", () => {
        const result = validatePassword("Short1A");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Au moins 8 caractères");
      });
  
      test("rejects password without uppercase", () => {
        const result = validatePassword("lowercase123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Au moins une majuscule");
      });
  
      test("rejects password without lowercase", () => {
        const result = validatePassword("UPPERCASE123");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Au moins une minuscule");
      });
  
      test("rejects password without numbers", () => {
        const result = validatePassword("NoNumbers");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Au moins un chiffre");
      });
  
      test("returns multiple errors for weak password", () => {
        const result = validatePassword("weak");
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Au moins 8 caractères");
        expect(result.errors).toContain("Au moins une majuscule");
        expect(result.errors).toContain("Au moins un chiffre");
        expect(result.errors).toHaveLength(3);
      });
  
      test("handles empty password", () => {
        const result = validatePassword("");
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(4); // All requirements fail
      });
  
      test("validates password with special characters", () => {
        const result = validatePassword("Strong@Pass123!");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
  
      test("validates minimum valid password", () => {
        const result = validatePassword("Pass123a");
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });