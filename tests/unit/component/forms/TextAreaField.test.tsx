import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextAreaField from "@/components/dashboard/forms/TextAreaField";
import { useState } from "react";

function ControlledTextAreaField() {
  const [value, setValue] = useState("");
  return (
    <TextAreaField name="test" label="test" value={value} onChange={setValue} />
  );
}

describe("TextAreaField", () => {
  const defaultProps = {
    label: "Description",
    name: "description",
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with label and textarea", () => {
    render(<TextAreaField {...defaultProps} />);

    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display the current value", () => {
    render(<TextAreaField {...defaultProps} value="Multi-line text value" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Multi-line text value");
  });

  it("should call onChange when user types", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<TextAreaField {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "hello\nworld");

    expect(onChange).toHaveBeenCalled();
  });

  it("should show required asterisk when required", () => {
    render(<TextAreaField {...defaultProps} required />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass("text-red-500");
  });

  it("should not show asterisk when not required", () => {
    render(<TextAreaField {...defaultProps} required={false} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should render with placeholder", () => {
    render(
      <TextAreaField
        {...defaultProps}
        placeholder="Describe your experience..."
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Describe your experience..."
    );
  });

  it("should apply custom className", () => {
    render(
      <TextAreaField {...defaultProps} className="custom-textarea-class" />
    );

    const container = screen.getByLabelText("Description").parentElement;
    expect(container).toHaveClass("custom-textarea-class");
  });

  it("should have proper accessibility attributes", () => {
    render(<TextAreaField {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    const label = screen.getByText("Description");

    expect(textarea).toHaveAttribute("id", "description");
    expect(textarea).toHaveAttribute("name", "description");
    expect(label).toHaveAttribute("for", "description");
  });

  it("should have required attribute when required", () => {
    render(<TextAreaField {...defaultProps} required />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeRequired();
  });

  it("should have proper styling classes", () => {
    render(<TextAreaField {...defaultProps} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass(
      "w-full",
      "px-3",
      "py-2",
      "border",
      "border-gray-300",
      "rounded-md",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-blue-500"
    );
  });

  it("should handle multiline input correctly", async () => {
    const user = userEvent.setup();

    render(<ControlledTextAreaField />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Line 1{enter}Line 2{enter}Line 3");

    const normalisé = (textarea as HTMLTextAreaElement).value.replace(/\r\n/g, "\n");
    expect(normalisé).toBe("Line 1\nLine 2\nLine 3");
  });
});
