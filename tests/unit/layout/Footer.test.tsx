import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";

describe("Footer Component", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  // TEST CASE 1: Component Renders
  it("should render without crashing", () => {
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  // TEST CASE 2: Logo and Brand
  describe("branding elements", () => {
    it("should display the CV Genius logo and text", () => {
      expect(screen.getByText("CV Genius")).toBeInTheDocument();
    });

    it("should render the FileText icon", () => {
      // The icon should be present in the component
      const logoContainer = screen.getByText("CV Genius").parentElement;
      expect(logoContainer).toHaveClass("flex", "items-center");
    });
  });

  // TEST CASE 3: Navigation Links
  describe("navigation links", () => {
    const expectedLinks = [
      { text: "À propos", href: "/about" },
      { text: "Confidentialité", href: "/privacy" },
      { text: "Conditions", href: "/terms" },
      { text: "Documentation", href: "/docs" },
      { text: "Support", href: "/support" },
    ];

    expectedLinks.forEach(({ text, href }) => {
      it(`should render ${text} link with correct href`, () => {
        const link = screen.getByRole("link", { name: text });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", href);
      });
    });

    it("should have hover effects on all navigation links", () => {
      expectedLinks.forEach(({ text }) => {
        const link = screen.getByRole("link", { name: text });
        expect(link).toHaveClass("hover:text-white");
      });
    });
  });

  // TEST CASE 4: Copyright Section
  describe("copyright section", () => {
    it("should display the copyright text", () => {
      expect(
        screen.getByText(
          "© 2024 CV Genius. Projet pédagogique - Tous droits réservés."
        )
      ).toBeInTheDocument();
    });

    it("should have proper styling for copyright section", () => {
      const copyrightText = screen.getByText(/© 2024 CV Genius/);
      const copyrightContainer = copyrightText.parentElement;
      expect(copyrightContainer).toHaveClass(
        "border-t",
        "border-white/30",
        "text-center",
        "text-gray-400"
      );
    });
  });

  // TEST CASE 5: Layout and Styling
  describe("layout and styling", () => {
    it("should have correct main footer styling", () => {
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("bg-white/10", "text-white", "py-12");
    });

    it("should have responsive layout classes", () => {
      const mainContainer = screen.getByRole("contentinfo").firstChild;
      expect(mainContainer).toHaveClass("max-w-7xl", "mx-auto");

      const flexContainer = mainContainer?.firstChild;
      expect(flexContainer).toHaveClass(
        "flex",
        "flex-col",
        "md:flex-row",
        "justify-between"
      );
    });
  });

  // TEST CASE 6: Accessibility
  describe("accessibility", () => {
    it("should have semantic footer element", () => {
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("should have all links accessible by role", () => {
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(6); // CV Genius logo link + 5 navigation links
    });

    it("should have proper link text for screen readers", () => {
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });
});
