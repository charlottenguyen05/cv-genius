import { render, screen, within } from "@testing-library/react";
import HomePage from "@/app/page";
import useUserStatus from "@/lib/hooks/useUserStatus";
import { User } from "@supabase/supabase-js";

// Mock the useUserStatus hook
jest.mock("@/lib/hooks/useUserStatus");
const mockUseUserStatus = jest.mocked(useUserStatus);

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href, className, ...rest }: any) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Sparkles: ({ className, ...props }: any) => (
    <svg data-testid="sparkles-icon" className={className} {...props} />
  ),
  FileText: ({ className, ...props }: any) => (
    <svg data-testid="filetext-icon" className={className} {...props} />
  ),
  Zap: ({ className, ...props }: any) => (
    <svg data-testid="zap-icon" className={className} {...props} />
  ),
  Users: ({ className, ...props }: any) => (
    <svg data-testid="users-icon" className={className} {...props} />
  ),
  Code: ({ className, ...props }: any) => (
    <svg data-testid="code-icon" className={className} {...props} />
  ),
  Database: ({ className, ...props }: any) => (
    <svg data-testid="database-icon" className={className} {...props} />
  ),
}));

describe("HomePage", () => {
  const mockUser: User = {
    id: "123",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2023-01-01T00:00:00Z",
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the main container with correct styling", () => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(<HomePage />);

      const mainContainer = screen.getByTestId("homepage");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass(
        "bg-gradient-to-br",
        "from-blue-50",
        "via-white",
        "to-purple-50"
      );
    });

    it("should render all main sections", () => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(<HomePage />);

      // Hero section
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      
      // Features section
      expect(screen.getByText("Pourquoi choisir CV Genius ?")).toBeInTheDocument();
      
      // Tech stack section
      expect(screen.getByText("Technologies Modernes")).toBeInTheDocument();
      
      // CTA section
      expect(screen.getByText("Prêt à créer votre CV parfait ?")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should render page while loading", () => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: true,
        error: null,
      });

      render(<HomePage />);

      expect(screen.getByTestId("homepage")).toBeInTheDocument();
      expect(screen.getByText(/Transformez votre CV avec l'/)).toBeInTheDocument();
    });

    it("should show project badge during loading", () => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: true,
        error: null,
      });

      render(<HomePage />);

      expect(screen.getByText("Projet pédagogique - En développement")).toBeInTheDocument();
      expect(screen.getAllByTestId("sparkles-icon")).toHaveLength(4); // Badge, Feature 0, Tech 2, CTA
    });
  });

  describe("Error State", () => {
    it("should render page even with error from useUserStatus", () => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: "Network error",
      });

      render(<HomePage />);

      expect(screen.getByTestId("homepage")).toBeInTheDocument();
      expect(screen.getByText(/Transformez votre CV avec l'/)).toBeInTheDocument();
    });
  });

  describe("Hero Section", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render hero section with correct structure and content", () => {
      render(<HomePage />);

      const heroSection = screen.getByRole("heading", { level: 1 }).closest("section");
      expect(heroSection).toHaveClass("py-20", "px-4", "sm:px-6", "lg:px-8");

      const badge = screen.getByText("Projet pédagogique - En développement");
      expect(badge).toHaveClass(
        "inline-flex",
        "items-center",
        "px-4",
        "py-2",
        "rounded-full",
        "bg-primary-100",
        "text-primary-700"
      );
    });

    it("should render main heading with gradient text", () => {
      render(<HomePage />);

      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveClass(
        "text-5xl",
        "md:text-6xl",
        "font-bold",
        "text-gray-900"
      );

      const gradientSpan = within(mainHeading).getByText("Intelligence Artificielle");
      expect(gradientSpan).toHaveClass(
        "text-transparent",
        "bg-clip-text",
        "bg-gradient-to-r",
        "from-blue-600",
        "to-purple-600"
      );
    });

    it("should render hero description", () => {
      render(<HomePage />);

      const description = screen.getByText(/Saisissez vos expériences en vrac/);
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass("text-xl", "text-gray-600");
    });
  });

  describe("User Not Authenticated", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should show register CTA with correct styling", () => {
      render(<HomePage />);

      const getStartedBtn = screen.getByTestId("get-started-cta");
      expect(getStartedBtn).toBeInTheDocument();
      expect(getStartedBtn).toHaveAttribute("href", "/register");
      expect(getStartedBtn).toHaveClass(
        "btn-primary",
        "text-lg",
        "px-8",
        "py-4",
        "rounded-full"
      );
      expect(getStartedBtn).toHaveTextContent("Commencer gratuitement");
    });

    it("should show demo link with correct styling", () => {
      render(<HomePage />);

      const demoLink = screen.getByTestId("demo-link");
      expect(demoLink).toBeInTheDocument();
      expect(demoLink).toHaveAttribute("href", "/dashboard");
      expect(demoLink).toHaveClass(
        "btn-secondary",
        "text-lg",
        "px-8",
        "py-4",
        "rounded-full"
      );
      expect(demoLink).toHaveTextContent("Voir la démo");
    });

    it("should show register CTA in footer section", () => {
      render(<HomePage />);

      const ctaRegisterBtn = screen.getByTestId("cta-register");
      expect(ctaRegisterBtn).toBeInTheDocument();
      expect(ctaRegisterBtn).toHaveAttribute("href", "/register");
      expect(ctaRegisterBtn).toHaveClass(
        "inline-flex",
        "items-center",
        "bg-white",
        "text-blue-600",
        "hover:bg-blue-50"
      );

      // Check for Sparkles icon in CTA
      const ctaIcon = within(ctaRegisterBtn).getByTestId("sparkles-icon");
      expect(ctaIcon).toBeInTheDocument();
      expect(ctaIcon).toHaveClass("w-5", "h-5", "ml-2");
    });

    it("should render CTA buttons container with correct layout", () => {
      render(<HomePage />);

      const buttonsContainer = screen.getByTestId("get-started-cta").parentElement;
      expect(buttonsContainer).toHaveClass(
        "flex",
        "flex-col",
        "sm:flex-row",
        "gap-4",
        "justify-center"
      );
    });
  });

  describe("User Authenticated", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
      });
    });

    it("should show dashboard CTA with correct styling", () => {
      render(<HomePage />);

      const startBuildingBtn = screen.getByTestId("start-building-cta");
      expect(startBuildingBtn).toBeInTheDocument();
      expect(startBuildingBtn).toHaveAttribute("href", "/dashboard");
      expect(startBuildingBtn).toHaveClass(
        "btn-primary",
        "text-lg",
        "px-8",
        "py-4",
        "rounded-full"
      );
      expect(startBuildingBtn).toHaveTextContent("Commencer mon CV");
    });

    it("should show cv-builder CTA in footer section", () => {
      render(<HomePage />);

      const ctaBuildCvBtn = screen.getByTestId("cta-build-cv");
      expect(ctaBuildCvBtn).toBeInTheDocument();
      expect(ctaBuildCvBtn).toHaveAttribute("href", "/dashboard");
      expect(ctaBuildCvBtn).toHaveClass(
        "inline-flex",
        "items-center",
        "bg-white",
        "text-blue-600",
        "hover:bg-blue-50"
      );

      // Check for Sparkles icon in CTA
      const ctaIcon = within(ctaBuildCvBtn).getByTestId("sparkles-icon");
      expect(ctaIcon).toBeInTheDocument();
      expect(ctaIcon).toHaveClass("w-5", "h-5", "ml-2");
    });

    it("should not show register CTAs for authenticated users", () => {
      render(<HomePage />);

      expect(screen.queryByTestId("get-started-cta")).not.toBeInTheDocument();
      expect(screen.queryByTestId("cta-register")).not.toBeInTheDocument();
    });
  });

  describe("Features Section", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render features section with correct structure", () => {
      render(<HomePage />);

      const featuresSection = screen.getByText("Pourquoi choisir CV Genius ?").closest("section");
      expect(featuresSection).toHaveClass("py-20", "bg-white");

      const featuresContainer = screen.getByText("Pourquoi choisir CV Genius ?").closest("div");
      expect(featuresContainer).toHaveClass("text-center", "mb-16");
    });

    it("should render all feature cards with icons and content", () => {
      render(<HomePage />);

      // Test feature 0 - IA Générative
      const feature0 = screen.getByTestId("feature-0");
      expect(feature0).toHaveClass(
        "card",
        "hover:shadow-lg",
        "transition-shadow",
        "duration-300"
      );
      expect(within(feature0).getByTestId("sparkles-icon")).toHaveClass(
        "w-12",
        "h-12",
        "text-primary-600",
        "mb-4"
      );
      expect(within(feature0).getByText("IA Générative")).toBeInTheDocument();
      expect(within(feature0).getByText(/Transformez vos idées brouillonnes/)).toBeInTheDocument();

      // Test feature 1 - Templates Modernes
      const feature1 = screen.getByTestId("feature-1");
      expect(within(feature1).getByTestId("filetext-icon")).toHaveClass(
        "w-12",
        "h-12",
        "text-primary-600",
        "mb-4"
      );
      expect(within(feature1).getByText("Templates Modernes")).toBeInTheDocument();
      expect(within(feature1).getByText(/Choisissez parmi des modèles optimisés/)).toBeInTheDocument();

      // Test feature 2 - Génération Rapide
      const feature2 = screen.getByTestId("feature-2");
      expect(within(feature2).getByTestId("zap-icon")).toHaveClass(
        "w-12",
        "h-12",
        "text-primary-600",
        "mb-4"
      );
      expect(within(feature2).getByText("Génération Rapide")).toBeInTheDocument();
      expect(within(feature2).getByText(/Obtenez votre CV optimisé/)).toBeInTheDocument();
    });

    it("should render features grid with correct layout", () => {
      render(<HomePage />);

      const featuresGrid = screen.getByTestId("feature-0").parentElement;
      expect(featuresGrid).toHaveClass("grid", "md:grid-cols-3", "gap-8");
    });

    it("should render feature headings with correct styling", () => {
      render(<HomePage />);

      const featureTitle = within(screen.getByTestId("feature-0")).getByRole("heading", { level: 3 });
      expect(featureTitle).toHaveClass(
        "text-xl",
        "font-semibold",
        "text-gray-900",
        "mb-3"
      );
    });
  });

  describe("Tech Stack Section", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render tech stack section with correct structure", () => {
      render(<HomePage />);

      const techSection = screen.getByText("Technologies Modernes").closest("section");
      expect(techSection).toHaveClass("py-20", "bg-gray-50");
    });

    it("should render all tech stack cards with icons and content", () => {
      render(<HomePage />);

      // Test tech 0 - Next.js 14
      const tech0 = screen.getByTestId("tech-0");
      expect(tech0).toHaveClass(
        "bg-white",
        "p-6",
        "rounded-lg",
        "border",
        "border-gray-200",
        "hover:border-primary-300",
        "transition-colors"
      );
      expect(within(tech0).getByTestId("code-icon")).toHaveClass(
        "w-8",
        "h-8",
        "text-primary-600",
        "mb-3"
      );
      expect(within(tech0).getByText("Next.js 14")).toBeInTheDocument();
      expect(within(tech0).getByText("App Router + Server Components")).toBeInTheDocument();

      // Test tech 1 - Supabase
      const tech1 = screen.getByTestId("tech-1");
      expect(within(tech1).getByTestId("database-icon")).toHaveClass(
        "w-8",
        "h-8",
        "text-primary-600",
        "mb-3"
      );
      expect(within(tech1).getByText("Supabase")).toBeInTheDocument();
      expect(within(tech1).getByText("Auth + Base de données temps réel")).toBeInTheDocument();

      // Test tech 2 - Gemini AI
      const tech2 = screen.getByTestId("tech-2");
      expect(within(tech2).getByTestId("sparkles-icon")).toHaveClass(
        "w-8",
        "h-8",
        "text-primary-600",
        "mb-3"
      );
      expect(within(tech2).getByText("Gemini AI")).toBeInTheDocument();
      expect(within(tech2).getByText("Intelligence artificielle avancée")).toBeInTheDocument();

      // Test tech 3 - TypeScript
      const tech3 = screen.getByTestId("tech-3");
      expect(within(tech3).getByTestId("users-icon")).toHaveClass(
        "w-8",
        "h-8",
        "text-primary-600",
        "mb-3"
      );
      expect(within(tech3).getByText("TypeScript")).toBeInTheDocument();
      expect(within(tech3).getByText("Développement type-safe")).toBeInTheDocument();
    });

    it("should render tech stack grid with correct layout", () => {
      render(<HomePage />);

      const techGrid = screen.getByTestId("tech-0").parentElement;
      expect(techGrid).toHaveClass(
        "grid",
        "md:grid-cols-2",
        "lg:grid-cols-4",
        "gap-6"
      );
    });

    it("should render tech headings with correct styling", () => {
      render(<HomePage />);

      const techTitle = within(screen.getByTestId("tech-0")).getByRole("heading", { level: 4 });
      expect(techTitle).toHaveClass("font-semibold", "text-gray-900", "mb-2");
    });

    it("should render tech descriptions with correct styling", () => {
      render(<HomePage />);

      const techDescription = within(screen.getByTestId("tech-0")).getByText("App Router + Server Components");
      expect(techDescription).toHaveClass("text-sm", "text-gray-600");
    });
  });

  describe("CTA Section", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render CTA section with correct structure and styling", () => {
      render(<HomePage />);

      const ctaSection = screen.getByText("Prêt à créer votre CV parfait ?").closest("section");
      expect(ctaSection).toHaveClass(
        "py-20",
        "bg-gradient-to-r",
        "from-blue-600",
        "to-purple-600"
      );

      const ctaContainer = screen.getByText("Prêt à créer votre CV parfait ?").closest("div");
      expect(ctaContainer).toHaveClass(
        "max-w-4xl",
        "mx-auto",
        "text-center",
        "px-4",
        "sm:px-6",
        "lg:px-8"
      );
    });

    it("should render CTA heading with correct styling", () => {
      render(<HomePage />);

      const ctaHeading = screen.getByText("Prêt à créer votre CV parfait ?");
      expect(ctaHeading).toHaveClass(
        "text-3xl",
        "md:text-4xl",
        "font-bold",
        "text-white",
        "mb-6"
      );
    });

    it("should render CTA description with correct styling", () => {
      render(<HomePage />);

      const ctaDescription = screen.getByText(/Rejoignez les utilisateurs qui ont déjà transformé/);
      expect(ctaDescription).toHaveClass(
        "text-xl",
        "text-blue-100",
        "mb-8",
        "max-w-2xl",
        "mx-auto"
      );
    });
  });

  describe("Development Mode Badge", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true
      });
    });

    it("should show development badge when in development mode", () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: "development",
        writable: true
      });
      
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(<HomePage />);

      const devBadge = screen.getByText("🚧 Mode développement");
      expect(devBadge).toBeInTheDocument();
      expect(devBadge).toHaveClass(
        "inline-flex",
        "items-center",
        "px-4",
        "py-2",
        "rounded-full",
        "bg-yellow-100",
        "text-yellow-700"
      );
    });

    it("should not show development badge in production", () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: "production",
        writable: true
      });
      
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(<HomePage />);

      expect(screen.queryByText("🚧 Mode développement")).not.toBeInTheDocument();
    });

    it("should not show development badge when NODE_ENV is undefined", () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: undefined,
        writable: true
      });
      
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });

      render(<HomePage />);

      expect(screen.queryByText("🚧 Mode développement")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility and Semantic HTML", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should have proper heading hierarchy", () => {
      render(<HomePage />);

      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent(/Transformez votre CV avec l'/);

      const h2Elements = screen.getAllByRole("heading", { level: 2 });
      expect(h2Elements).toHaveLength(3);
      expect(h2Elements[0]).toHaveTextContent("Pourquoi choisir CV Genius ?");
      expect(h2Elements[1]).toHaveTextContent("Technologies Modernes");
      expect(h2Elements[2]).toHaveTextContent("Prêt à créer votre CV parfait ?");

      const h3Elements = screen.getAllByRole("heading", { level: 3 });
      expect(h3Elements).toHaveLength(3); // One for each feature

      const h4Elements = screen.getAllByRole("heading", { level: 4 });
      expect(h4Elements).toHaveLength(4); // One for each tech stack item
    });

    it("should have accessible links with proper attributes", () => {
      render(<HomePage />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });

      // Test specific links by data-testid to avoid conflicts
      expect(screen.getByTestId("demo-link")).toHaveAttribute("href", "/dashboard");
      expect(screen.getByTestId("get-started-cta")).toHaveAttribute("href", "/register");
    });

    it("should render semantic HTML sections", () => {
      render(<HomePage />);

      // Check for sections by finding elements with section role or by content
      const heroSection = screen.getByRole("heading", { level: 1 }).closest("section");
      const featuresSection = screen.getByText("Pourquoi choisir CV Genius ?").closest("section");
      const techSection = screen.getByText("Technologies Modernes").closest("section");
      const ctaSection = screen.getByText("Prêt à créer votre CV parfait ?").closest("section");

      expect(heroSection).toBeInTheDocument();
      expect(featuresSection).toBeInTheDocument();
      expect(techSection).toBeInTheDocument();
      expect(ctaSection).toBeInTheDocument();
    });

    it("should have proper data-testid attributes for all testable elements", () => {
      render(<HomePage />);

      expect(screen.getByTestId("homepage")).toBeInTheDocument();
      expect(screen.getByTestId("demo-link")).toBeInTheDocument();
      expect(screen.getByTestId("get-started-cta")).toBeInTheDocument();
      expect(screen.getByTestId("cta-register")).toBeInTheDocument();

      // Feature test IDs
      for (let i = 0; i < 3; i++) {
        expect(screen.getByTestId(`feature-${i}`)).toBeInTheDocument();
      }

      // Tech test IDs
      for (let i = 0; i < 4; i++) {
        expect(screen.getByTestId(`tech-${i}`)).toBeInTheDocument();
      }
    });
  });

  describe("Icon Components", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render all icons with correct test IDs and classes", () => {
      render(<HomePage />);

      // Check total count of sparkles icons (badge + feature 0 + tech 2 + CTA)
      expect(screen.getAllByTestId("sparkles-icon")).toHaveLength(4);

      // Feature icons (scoped within their containers)
      const feature0 = screen.getByTestId("feature-0");
      const feature1 = screen.getByTestId("feature-1");
      const feature2 = screen.getByTestId("feature-2");

      expect(within(feature0).getByTestId("sparkles-icon")).toBeInTheDocument();
      expect(within(feature1).getByTestId("filetext-icon")).toBeInTheDocument();
      expect(within(feature2).getByTestId("zap-icon")).toBeInTheDocument();

      // Tech stack icons (scoped within their containers)
      const tech0 = screen.getByTestId("tech-0");
      const tech1 = screen.getByTestId("tech-1");
      const tech2 = screen.getByTestId("tech-2");
      const tech3 = screen.getByTestId("tech-3");

      expect(within(tech0).getByTestId("code-icon")).toBeInTheDocument();
      expect(within(tech1).getByTestId("database-icon")).toBeInTheDocument();
      expect(within(tech2).getByTestId("sparkles-icon")).toBeInTheDocument();
      expect(within(tech3).getByTestId("users-icon")).toBeInTheDocument();

      // Check individual icon types count
      expect(screen.getAllByTestId("filetext-icon")).toHaveLength(1);
      expect(screen.getAllByTestId("zap-icon")).toHaveLength(1);
      expect(screen.getAllByTestId("code-icon")).toHaveLength(1);
      expect(screen.getAllByTestId("database-icon")).toHaveLength(1);
      expect(screen.getAllByTestId("users-icon")).toHaveLength(1);
    });
  });

  describe("Data Arrays and Mapping", () => {
    beforeEach(() => {
      mockUseUserStatus.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
      });
    });

    it("should render exactly 3 feature items from features array", () => {
      render(<HomePage />);

      const featureCards = screen.getAllByTestId(/^feature-\d+$/);
      expect(featureCards).toHaveLength(3);

      // Verify each feature has required elements
      featureCards.forEach((card, index) => {
        expect(card).toHaveAttribute("data-testid", `feature-${index}`);
        expect(within(card).getByRole("heading", { level: 3 })).toBeInTheDocument();
      });
    });

    it("should render exactly 4 tech stack items from techStack array", () => {
      render(<HomePage />);

      const techCards = screen.getAllByTestId(/^tech-\d+$/);
      expect(techCards).toHaveLength(4);

      // Verify each tech has required elements
      techCards.forEach((card, index) => {
        expect(card).toHaveAttribute("data-testid", `tech-${index}`);
        expect(within(card).getByRole("heading", { level: 4 })).toBeInTheDocument();
      });
    });
  });
});