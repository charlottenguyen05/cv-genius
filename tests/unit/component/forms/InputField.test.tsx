import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputField from "@/components/dashboard/forms/InputField";

describe("InputField", () => {
  const defaultProps = {
    label: "Test Label",
    name: "test-field",
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with label and input", () => {
    render(<InputField {...defaultProps} />);
    
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display the current value", () => {
    render(<InputField {...defaultProps} value="test value" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("test value");
  });

  it("should call onChange when user types", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    
    render(<InputField {...defaultProps} onChange={onChange} />);
    
    const input = screen.getByRole("textbox");
    await user.type(input, "hello");
    
    expect(onChange).toHaveBeenCalledTimes(5); // One call per character
  });

  it("should show required asterisk when required", () => {
    render(<InputField {...defaultProps} required />);
    
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass("text-red-500");
  });

  it("should not show asterisk when not required", () => {
    render(<InputField {...defaultProps} required={false} />);
    
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("should render with placeholder", () => {
    render(<InputField {...defaultProps} placeholder="Enter text here" />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("placeholder", "Enter text here");
  });

  it("should render with different input types", () => {
    const { rerender } = render(<InputField {...defaultProps} type="email" />);
    
    let input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
    
    rerender(<InputField {...defaultProps} type="password" />);
    input = screen.getByDisplayValue("");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should apply custom className", () => {
    render(<InputField {...defaultProps} className="custom-class" />);
    
    const container = screen.getByLabelText("Test Label").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("should have proper accessibility attributes", () => {
    render(<InputField {...defaultProps} />);
    
    const input = screen.getByRole("textbox");
    const label = screen.getByText("Test Label");
    
    expect(input).toHaveAttribute("id", "test-field");
    expect(input).toHaveAttribute("name", "test-field");
    expect(label).toHaveAttribute("for", "test-field");
  });

  it("should have required attribute when required", () => {
    render(<InputField {...defaultProps} required />);
    
    const input = screen.getByRole("textbox");
    expect(input).toBeRequired();
  });

  it("should have focus styles", () => {
    render(<InputField {...defaultProps} />);
    
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("focus:ring-2", "focus:ring-blue-500", "focus:border-transparent");
  });
}); 