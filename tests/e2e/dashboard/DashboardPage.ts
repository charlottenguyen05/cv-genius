import { Page } from "playwright/types/test";
import { expect } from "playwright/test";

export class DashboardPage {
  constructor(private page: Page, private browserName: string) {}

  private selectors = {
    dashboard: "[data-testid='dashboard-page']",
    dashboardTitle: "[data-testid='dashboard-title']",
    dashboardSubtitle: "[data-testid='dashboard-subtitle']",
    infoBanner: "[data-testid='info-banner']",
    parsingSuccessBanner: "[data-testid='parsing-success-banner']",
    dashboardContent: "[data-testid='dashboard-content']",
    formSection: "[data-testid='cv-form-wrapper']",

    // File Upload Section
    fileUploadZone: "[data-testid='file-upload-zone']",
    fileInput: "[data-testid='file-input']",

    // Personal Info Section
    personalInfoSection: "[data-testid='personal-info-section']",
    nameInput: "[data-testid='personal-info-name']",
    emailInput: "[data-testid='personal-info-email']",
    phoneInput: "[data-testid='personal-info-phone']",
    addressInput: "[data-testid='personal-info-address']",

    // Experience Section
    experienceSection: "[data-testid='experience-section']",
    addExperienceButton: "[data-testid='add-experience-button']",

    // Education Section
    educationSection: "[data-testid='education-section']",
    addEducationButton: "[data-testid='add-education-button']",

    // Skills Section
    skillsSection: "[data-testid='skills-section']",

    // Submit Section
    submitSection: "[data-testid='submit-section']",
    generateCvButton: "[data-testid='generate-cv-button']",
    submitRequirements: "[data-testid='submit-requirements']",

    // Generation Modal
    cvGenerationModal: "[data-testid='cv-generation-modal']",

    // Loading and Success States
    loadingSpinner: "[data-testid='loading-spinner']",
    loadingText: "[data-testid='loading-text']",
    generateTextButton: "[data-testid='generate-text']",
    status: '[data-testid="cv-generation-status"]',

    // Toast Messages
    successToast: "[data-testid='success-toast']",
    errorToast: "[data-testid='error-toast']",
  };

  async goto() {
    await this.page.goto("/dashboard");
    await this.expectPagelLoadSuccessful();
  }

  async uploadFile(fileName: string) {
    await this.page.locator(this.selectors.fileInput).setInputFiles(fileName);
  }

  async expectParsingSuccess() {
    await expect(
      this.page.locator(this.selectors.parsingSuccessBanner)
    ).toBeVisible();
  }

  async fillMonthInputBasedOnBrowser(selector: string, value: string) {
    const element = this.page.locator(selector);
    await element.waitFor({ state: "visible" });

    switch (this.browserName) {
      case "chromium":
      case "Mobile Chrome":
      case "Mobile Safari":
        // Show month input correctly
        const month = "May";
        const year = "2023";
        await element.focus();
        await element.pressSequentially(month);
        await this.page.keyboard.press("ArrowRight");
        await element.pressSequentially(year);
        break;

      case "firefox":
      case "webkit":
        // These browsers show month input as text input
        await element.fill(value);
        break;
    }
  }

  /** Add missing start date for the parsed experience and add new experience */
  async addExperience(
    companyName: string = "Test Company",
    position: string = "Test Position",
    description: string = "Test experience description",
    startDate: string = "2023-03",
    endDate?: string
  ) {
    // Fill the missing start date for the parsed data
    await this.fillMonthInputBasedOnBrowser(
      '[data-testid="experience-0-startDate"]',
      startDate
    );
    // Add new experience
    await this.page.click(this.selectors.addExperienceButton);
    await this.page.fill('[data-testid="experience-1-company"]', companyName);
    await this.page.fill('[data-testid="experience-1-position"]', position);
    await this.page.fill(
      '[data-testid="experience-1-description"]',
      description
    );
    await this.fillMonthInputBasedOnBrowser(
      '[data-testid="experience-1-startDate"]',
      startDate
    );
  }

  async startImproveCV() {
    await this.page.click(this.selectors.generateCvButton);
    await expect(
      this.page.locator(this.selectors.cvGenerationModal)
    ).toBeVisible();
  }

  async expectImproveSuccess() {
    await expect(this.page.locator(this.selectors.status)).toContainText(
      "Génération en cours..."
    );
    await expect(this.page.locator(this.selectors.status)).toContainText(
      "Génération en cours..."
    );
  }

  async expectPagelLoadSuccessful() {
    await expect(this.page.locator(this.selectors.dashboard)).toBeVisible();
    await expect(
      this.page.locator(this.selectors.fileUploadZone)
    ).toBeVisible();
    await expect(this.page.locator(this.selectors.formSection)).toBeVisible();
  }
}
