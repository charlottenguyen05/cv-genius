import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CVFormSections from "@/components/dashboard/CVFormSections";
import { CVFormData } from "@/types";

// Mock child components
jest.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick, "data-testid": testId, ...props }: any) => (
    <button onClick={onClick} data-testid={testId} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/dashboard/forms/InputField", () => ({
  __esModule: true,
  default: ({ label, value, onChange, "data-testid": testId, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        {...props}
      />
    </div>
  ),
}));

jest.mock("@/components/dashboard/forms/TextAreaField", () => ({
  __esModule: true,
  default: ({ label, value, onChange, "data-testid": testId, ...props }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        {...props}
      />
    </div>
  ),
}));

jest.mock("@/components/dashboard/forms/SelectField", () => ({
  __esModule: true,
  default: ({ label, value, onChange, options, "data-testid": testId, ...props }: any) => (
    <div>
      <label>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        {...props}
      >
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

jest.mock("@/components/ui/DeleteButton", () => ({
  __esModule: true,
  default: ({ onClick, "data-testid": testId, ariaLabel, ...props }: any) => (
    <button onClick={onClick} data-testid={testId} aria-label={ariaLabel} {...props}>
      Delete
    </button>
  ),
}));

describe("CVFormSections", () => {
  const mockFormData: CVFormData = {
    personalInfo: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+33123456789",
      location: "Paris, France",
      linkedin: "https://linkedin.com/in/johndoe",
      website: "https://johndoe.com",
    },
    experiences: [
      {
        id: "exp-1",
        company: "Tech Corp",
        position: "Developer",
        location: "Paris",
        startDate: "2022-01",
        endDate: "2023-12",
        description: "Developed applications",
        isCurrentPosition: false,
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University",
        degree: "Master",
        field: "Computer Science",
        startDate: "2019-09",
        endDate: "2021-06",
        description: "Specialized in web development",
      },
    ],
    skills: [
      {
        id: "skill-1",
        name: "React",
        category: "technical",
        level: "advanced",
      },
    ],
    languages: [
      {
        id: "lang-1",
        name: "French",
        level: "native",
      },
    ],
  };

  const mockHandlers = {
    updatePersonalInfo: jest.fn(),
    experienceHandlers: {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    educationHandlers: {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    skillHandlers: {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
    languageHandlers: {
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Personal Information Section", () => {
    it("should render personal info section with all fields", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      expect(screen.getByText("2. Informations personnelles")).toBeInTheDocument();
      expect(screen.getByTestId("name-input")).toHaveValue("John Doe");
      expect(screen.getByTestId("email-input")).toHaveValue("john@example.com");
      expect(screen.getByTestId("phone-input")).toHaveValue("+33123456789");
      expect(screen.getByTestId("location-input")).toHaveValue("Paris, France");
      expect(screen.getByTestId("linkedin-input")).toHaveValue("https://linkedin.com/in/johndoe");
      expect(screen.getByTestId("website-input")).toHaveValue("https://johndoe.com");
    });

    it("should call updatePersonalInfo when personal info fields are changed", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const nameInput = screen.getByTestId("name-input");
      await user.type(nameInput, "!");

      // Check that updatePersonalInfo was called with "name" field
      expect(mockHandlers.updatePersonalInfo).toHaveBeenCalledWith("name", expect.any(String));
    });

    it("should handle empty personal info values", () => {
      const emptyFormData = {
        ...mockFormData,
        personalInfo: {},
      };
      
      render(<CVFormSections formData={emptyFormData} {...mockHandlers} />);

      expect(screen.getByTestId("name-input")).toHaveValue("");
      expect(screen.getByTestId("email-input")).toHaveValue("");
    });
  });

  describe("Experience Section", () => {
    it("should render experience section with existing experience", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      expect(screen.getByText("3. Expériences professionnelles")).toBeInTheDocument();
      expect(screen.getByTestId("add-experience-button")).toBeInTheDocument();
      expect(screen.getByTestId("experience-0")).toBeInTheDocument();
      expect(screen.getByTestId("experience-0-company")).toHaveValue("Tech Corp");
      expect(screen.getByTestId("experience-0-position")).toHaveValue("Developer");
    });

    it("should call add handler when add experience button is clicked", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const addButton = screen.getByTestId("add-experience-button");
      await user.click(addButton);

      expect(mockHandlers.experienceHandlers.add).toHaveBeenCalledTimes(1);
    });

    it("should call update handler when experience fields are changed", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const companyInput = screen.getByTestId("experience-0-company");
      await user.type(companyInput, "!");

      expect(mockHandlers.experienceHandlers.update).toHaveBeenCalledWith(0, "company", expect.any(String));
    });

    it("should call remove handler when delete experience button is clicked", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const removeButton = screen.getByTestId("remove-experience-0");
      await user.click(removeButton);

      expect(mockHandlers.experienceHandlers.remove).toHaveBeenCalledWith(0);
    });

    it("should handle current position checkbox", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const checkbox = screen.getByTestId("experience-0-current");
      await user.click(checkbox);

      expect(mockHandlers.experienceHandlers.update).toHaveBeenCalledWith(0, "isCurrentPosition", true);
    });

    it("should render multiple experiences", () => {
      const multiExperienceData = {
        ...mockFormData,
        experiences: [
          mockFormData.experiences[0],
          {
            id: "exp-2",
            company: "Another Corp",
            position: "Senior Developer",
            startDate: "2023-01",
            description: "Advanced development",
          },
        ],
      };

      render(<CVFormSections formData={multiExperienceData} {...mockHandlers} />);

      expect(screen.getByTestId("experience-0")).toBeInTheDocument();
      expect(screen.getByTestId("experience-1")).toBeInTheDocument();
      expect(screen.getByTestId("experience-1-company")).toHaveValue("Another Corp");
    });
  });

  describe("Education Section", () => {
    it("should render education section with existing education", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      expect(screen.getByText("4. Formation")).toBeInTheDocument();
      expect(screen.getByTestId("add-education-button")).toBeInTheDocument();
      expect(screen.getByTestId("education-0")).toBeInTheDocument();
      expect(screen.getByTestId("education-0-school")).toHaveValue("University");
      expect(screen.getByTestId("education-0-degree")).toHaveValue("Master");
    });

    it("should call education handlers when interacting with education fields", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      // Test add
      await user.click(screen.getByTestId("add-education-button"));
      expect(mockHandlers.educationHandlers.add).toHaveBeenCalledTimes(1);

      // Test update
      const institutionInput = screen.getByTestId("education-0-school");
      await user.type(institutionInput, "!");
      expect(mockHandlers.educationHandlers.update).toHaveBeenCalledWith(0, "institution", expect.any(String));

      // Test remove
      await user.click(screen.getByTestId("remove-education-0"));
      expect(mockHandlers.educationHandlers.remove).toHaveBeenCalledWith(0);
    });
  });

  describe("Skills Section", () => {
    it("should render skills section with existing skills", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      expect(screen.getByText("5. Compétences")).toBeInTheDocument();
      expect(screen.getByTestId("add-skill-button")).toBeInTheDocument();
      expect(screen.getByTestId("skill-0")).toBeInTheDocument();
      expect(screen.getByTestId("skill-0-name")).toHaveValue("React");
      expect(screen.getByTestId("skill-0-category")).toHaveValue("technical");
      expect(screen.getByTestId("skill-0-level")).toHaveValue("advanced");
    });

    it("should call skill handlers when interacting with skill fields", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      // Test add
      await user.click(screen.getByTestId("add-skill-button"));
      expect(mockHandlers.skillHandlers.add).toHaveBeenCalledTimes(1);

      // Test update
      const skillNameInput = screen.getByTestId("skill-0-name");
      await user.type(skillNameInput, "!");
      expect(mockHandlers.skillHandlers.update).toHaveBeenCalledWith(0, "name", expect.any(String));

      // Test remove
      await user.click(screen.getByTestId("remove-skill-0"));
      expect(mockHandlers.skillHandlers.remove).toHaveBeenCalledWith(0);
    });

    it("should handle skill category and level selection", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      const categorySelect = screen.getByTestId("skill-0-category");
      await user.selectOptions(categorySelect, "soft");
      expect(mockHandlers.skillHandlers.update).toHaveBeenCalledWith(0, "category", "soft");

      const levelSelect = screen.getByTestId("skill-0-level");
      await user.selectOptions(levelSelect, "expert");
      expect(mockHandlers.skillHandlers.update).toHaveBeenCalledWith(0, "level", "expert");
    });
  });

  describe("Languages Section", () => {
    it("should render languages section with existing languages", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      expect(screen.getByText("6. Langues")).toBeInTheDocument();
      expect(screen.getByTestId("add-language-button")).toBeInTheDocument();
      expect(screen.getByTestId("language-0")).toBeInTheDocument();
      expect(screen.getByTestId("language-0-name")).toHaveValue("French");
      expect(screen.getByTestId("language-0-level")).toHaveValue("native");
    });

    it("should call language handlers when interacting with language fields", async () => {
      const user = userEvent.setup();
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      // Test add
      await user.click(screen.getByTestId("add-language-button"));
      expect(mockHandlers.languageHandlers.add).toHaveBeenCalledTimes(1);

      // Test update
      const languageNameInput = screen.getByTestId("language-0-name");
      await user.type(languageNameInput, "!");
      expect(mockHandlers.languageHandlers.update).toHaveBeenCalledWith(0, "name", expect.any(String));

      // Test remove
      await user.click(screen.getByTestId("remove-language-0"));
      expect(mockHandlers.languageHandlers.remove).toHaveBeenCalledWith(0);
    });

    it("should handle empty languages array", () => {
      const noLanguagesData = {
        ...mockFormData,
        languages: undefined,
      };

      render(<CVFormSections formData={noLanguagesData} {...mockHandlers} />);
      
      expect(screen.getByText("6. Langues")).toBeInTheDocument();
      expect(screen.getByTestId("add-language-button")).toBeInTheDocument();
      expect(screen.queryByTestId("language-0")).not.toBeInTheDocument();
    });
  });

  describe("Data Test IDs", () => {
    it("should have proper data-testids for all sections", () => {
      render(<CVFormSections formData={mockFormData} {...mockHandlers} />);

      // Main sections
      expect(screen.getByTestId("cv-form")).toBeInTheDocument();
      expect(screen.getByTestId("experiences-section")).toBeInTheDocument();
      expect(screen.getByTestId("education-section")).toBeInTheDocument();
      expect(screen.getByTestId("skills-section")).toBeInTheDocument();
      expect(screen.getByTestId("languages-section")).toBeInTheDocument();

      // Add buttons
      expect(screen.getByTestId("add-experience-button")).toBeInTheDocument();
      expect(screen.getByTestId("add-education-button")).toBeInTheDocument();
      expect(screen.getByTestId("add-skill-button")).toBeInTheDocument();
      expect(screen.getByTestId("add-language-button")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form data", () => {
      const emptyFormData: CVFormData = {
        personalInfo: {},
        experiences: [],
        education: [],
        skills: [],
        languages: [],
      };

      render(<CVFormSections formData={emptyFormData} {...mockHandlers} />);

      expect(screen.getByText("2. Informations personnelles")).toBeInTheDocument();
      expect(screen.getByText("3. Expériences professionnelles")).toBeInTheDocument();
      expect(screen.getByText("4. Formation")).toBeInTheDocument();
      expect(screen.getByText("5. Compétences")).toBeInTheDocument();
      expect(screen.getByText("6. Langues")).toBeInTheDocument();
    });

    it("should handle incomplete data in arrays", () => {
      const incompleteData: CVFormData = {
        personalInfo: { name: "John" },
        experiences: [{ id: "exp-1" }],
        education: [{ id: "edu-1" }],
        skills: [{ id: "skill-1" }],
        languages: [{ id: "lang-1" }],
      };

      render(<CVFormSections formData={incompleteData} {...mockHandlers} />);

      expect(screen.getByTestId("experience-0-company")).toHaveValue("");
      expect(screen.getByTestId("education-0-school")).toHaveValue("");
      expect(screen.getByTestId("skill-0-name")).toHaveValue("");
      expect(screen.getByTestId("language-0-name")).toHaveValue("");
    });
  });
}); 