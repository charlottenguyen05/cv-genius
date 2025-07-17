import { test, expect } from "@playwright/test";
import fs from "fs";

test.describe("API endpoints testing", () => {
  test("POST /api/parser with PDF file should return ", async ({ request }) => {
    const pdfBuffer = fs.readFileSync("tests/e2e/fixtures/CV_test.pdf");

    const response = await request.post("/api/parser", {
      multipart: {
        file: {
          name: "CV_test.pdf",
          mimeType: "application/pdf",
          buffer: pdfBuffer,
        },
      },
    });

    expect(response.status()).toBe(200);
    // Add more assertions as needed
  });
});
