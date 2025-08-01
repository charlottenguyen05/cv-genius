import {
    cn,
    formatDate,
    isValidEmail,
    cleanText,
    generateId,
    debounce,
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
  
    describe("formatDate", () => {
      test("formats Date object to French locale", () => {
        const date = new Date(2024, 0, 15); // January 15, 2024
        const result = formatDate(date);
        expect(result).toBe("15 janvier 2024");
      });
  
      test("formats date string to French locale", () => {
        const result = formatDate("2024-06-20");
        expect(result).toBe("20 juin 2024");
      });
  
      test("handles ISO string format", () => {
        const result = formatDate("2024-12-25T10:30:00Z");
        expect(result).toBe("25 décembre 2024");
      });
  
      test("handles invalid date gracefully", () => {
        const result = formatDate("invalid-date");
        expect(result).toBe("Invalid Date");
      });
    });
  
    describe("isValidEmail", () => {
      test("validates correct email formats", () => {
        expect(isValidEmail("test@example.com")).toBe(true);
        expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
        expect(isValidEmail("user+tag@example.org")).toBe(true);
        expect(isValidEmail("123@numbers.com")).toBe(true);
      });
  
      test("rejects invalid email formats", () => {
        expect(isValidEmail("invalid")).toBe(false);
        expect(isValidEmail("@example.com")).toBe(false);
        expect(isValidEmail("user@")).toBe(false);
        expect(isValidEmail("user@domain")).toBe(false);
        expect(isValidEmail("user name@example.com")).toBe(false);
        expect(isValidEmail("")).toBe(false);
        expect(isValidEmail("user@domain.")).toBe(false);
      });
    });
  
    describe("cleanText", () => {
      test("trims whitespace", () => {
        expect(cleanText("  hello world  ")).toBe("Hello world");
      });
  
      test("replaces multiple spaces with single space", () => {
        expect(cleanText("hello    world   test")).toBe("Hello world test");
      });
  
      test("capitalizes first letter", () => {
        expect(cleanText("hello world")).toBe("Hello world");
      });
  
      test("handles mixed formatting issues", () => {
        expect(cleanText("  hello    world  ")).toBe("Hello world");
      });
  
      test("handles empty and single character strings", () => {
        expect(cleanText("")).toBe("");
        expect(cleanText("a")).toBe("A");
        expect(cleanText("  a  ")).toBe("A");
      });
  
      test("preserves internal punctuation", () => {
        expect(cleanText("hello, world!")).toBe("Hello, world!");
      });
    });
  
    describe("generateId", () => {
      test("generates non-empty string", () => {
        const id = generateId();
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      });
  
      test("generates unique IDs", () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
      });
  
      test("generates multiple unique IDs", () => {
        const ids = Array.from({ length: 100 }, () => generateId());
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(100);
      });
    });
  
    describe("debounce", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });
  
      afterEach(() => {
        jest.useRealTimers();
      });
  
      test("delays function execution", () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);
  
        debouncedFn();
        expect(mockFn).not.toHaveBeenCalled();
  
        jest.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledTimes(1);
      });
  
      test("cancels previous calls when called multiple times", () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);
  
        debouncedFn();
        debouncedFn();
        debouncedFn();
  
        jest.advanceTimersByTime(100);
        expect(mockFn).toHaveBeenCalledTimes(1);
      });
  
      test("passes arguments correctly", () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);
  
        debouncedFn("arg1", "arg2");
        jest.advanceTimersByTime(100);
  
        expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
      });
  
      test("resets timer on subsequent calls", () => {
        const mockFn = jest.fn();
        const debouncedFn = debounce(mockFn, 100);
  
        debouncedFn();
        jest.advanceTimersByTime(50);
        debouncedFn(); // Should reset the timer
  
        jest.advanceTimersByTime(50);
        expect(mockFn).not.toHaveBeenCalled(); // Should not have been called yet
  
        jest.advanceTimersByTime(50);
        expect(mockFn).toHaveBeenCalledTimes(1);
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