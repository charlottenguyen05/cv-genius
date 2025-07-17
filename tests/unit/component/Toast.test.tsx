import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "@/components/ui/Toast";
import {act} from "react";

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render toast with message", () => {
    render(<Toast message="Test message" onClose={jest.fn()} />);
    
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("should render error toast with correct styling", () => {
    render(<Toast message="Error message" type="error" onClose={jest.fn()} />);
    
    const toast = screen.getByText("Error message").parentElement;
    expect(toast).toHaveClass("bg-red-500");
  });

  it("should render success toast with correct styling", () => {
    render(<Toast message="Success message" type="success" onClose={jest.fn()} />);
    
    const toast = screen.getByText("Success message").parentElement;
    expect(toast).toHaveClass("bg-green-500");
  });

  it("should render warning toast with correct styling", () => {
    render(<Toast message="Warning message" type="warning" onClose={jest.fn()} />);
    
    const toast = screen.getByText("Warning message").parentElement;
    expect(toast).toHaveClass("bg-yellow-500", "text-black");
  });

  it("should render info toast with correct styling", () => {
    render(<Toast message="Info message" type="info" onClose={jest.fn()} />);
    
    const toast = screen.getByText("Info message").parentElement;
    expect(toast).toHaveClass("bg-blue-500");
  });

  it("should auto-close after default duration", () => {
    const onClose = jest.fn();
    
    render(<Toast message="Auto close message" onClose={onClose} />);
    
    expect(onClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(5000); // default duration
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it("should auto-close after custom duration", () => {
    const onClose = jest.fn();
    
    render(<Toast message="Custom duration" onClose={onClose} duration={3000} />);
    
    expect(onClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onClose when close button is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    render(<Toast message="Closable message" onClose={onClose} />);
    
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it("should have proper accessibility attributes", () => {
    render(<Toast message="Accessible toast" onClose={jest.fn()} />);
    
    const toast = screen.getByRole("alert");
    expect(toast).toBeInTheDocument();
    
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toHaveAttribute("aria-label", "Close");
  });

  it("should not call onClose if not provided", () => {
    render(<Toast message="No onClose handler" />);
    
    // Should not throw error
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(screen.queryByText("No onClose handler")).not.toBeInTheDocument();
  });
}); 