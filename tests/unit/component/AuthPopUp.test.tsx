import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPopUp from "@/components/ui/AuthPopUp";

describe("AuthPopUp", () => {
  it("should render modal when open", () => {
    render(
      <AuthPopUp 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );
    
    expect(screen.getByText("Authentification requise")).toBeInTheDocument();
    expect(screen.getByTestId("auth-popup")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    render(
      <AuthPopUp 
        isOpen={false} 
        onClose={jest.fn()} 
      />
    );
    
    expect(screen.queryByText("Authentification requise")).not.toBeInTheDocument();
  });

  it("should display login and register buttons", () => {
    render(
      <AuthPopUp 
        isOpen={true} 
        onClose={jest.fn()} 
      />
    );
    
    expect(screen.getByTestId("signin-button")).toBeInTheDocument();
    expect(screen.getByTestId("register-button")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AuthPopUp 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    const closeButton = screen.getByTestId("close-button")
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it("should not close when modal content is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    
    render(
      <AuthPopUp 
        isOpen={true} 
        onClose={onClose} 
      />
    );
    
    const modalContent = screen.getByText("Authentification requise");
    await user.click(modalContent);
    
    expect(onClose).not.toHaveBeenCalled();
  });
}); 