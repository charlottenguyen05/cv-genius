import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("should renders a button with the correct text", () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole("button", { name: /click/i })).toBeInTheDocument();
  });
  it("should call the onClick function when clicked", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole("button", { name: /click/i });
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });
  it("should not be disable if loading and disable attribute false", () => {
    render(
      <Button disabled={false} loading={false}>
        Click me
      </Button>
    );
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).not.toHaveAttribute("disabled");
  });
  it("should deactivate the click when loading=true", () => {
    const handleClick = jest.fn();
    render(
      <Button loading={true} onClick={handleClick}>
        Click me
      </Button>
    );
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
