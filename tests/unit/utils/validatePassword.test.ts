import { validatePassword } from "@/lib/utils";

describe("validatePassword", () => {
    it("should return true if the password is valid", () => {
        const password = "Password123!";
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
    });
    it("should return false if the password is too short", () => {
        const password = "Pass1!";
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
    });
    it("should return false if the password does not contain an uppercase letter", () => {
        const password = "password123!";
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
    });
    it("should return false if the password does not contain a lowercase letter", () => {
        const password = "PASSWORD123!";
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
    });
    it("should return false if the password does not contain a number", () => {
        const password = "Password!@#";
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
    });
})

// Test complexe case: Should return multiples errors for a password with multiples issues
// Test edge case: Password with exactly 8 characters