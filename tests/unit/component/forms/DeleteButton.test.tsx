// __tests__/DeleteButton.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteButton from '@/components/dashboard/forms/DeleteButton';

// Inline mock for lucide-react icons (Trash2 and X)
jest.mock('lucide-react', () => ({
  Trash2: ({ className }: { className?: string }) => (
    <svg data-testid="trash-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <svg data-testid="x-icon" className={className} />
  ),
}));

describe('DeleteButton component', () => {
  it('renders a button with default props', () => {
    render(<DeleteButton onClick={jest.fn()} />);

    // The button should be present and accessible by its default aria-label
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Default icon is Trash2
    expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
  });

  it('calls the onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<DeleteButton onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the "x" variant when specified', () => {
    render(
      <DeleteButton
        onClick={() => {}}
        variant="x"
        ariaLabel="Close"
      />,
    );

    // Only the X icon should be present
    expect(screen.queryByTestId('x-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
  });

  it('applies the custom className passed via props', () => {
    render(<DeleteButton onClick={() => {}} className="test-class" />);

    expect(screen.getByRole('button')).toHaveClass('test-class');
  });

  it('applies the correct padding and icon dimensions for each size', () => {
    // Render with small size first
    const { rerender } = render(<DeleteButton onClick={() => {}} size="sm" />);

    let button = screen.getByRole('button');
    let icon = screen.getByTestId('trash-icon');
    expect(button).toHaveClass('p-1');
    expect(icon).toHaveClass('h-3', 'w-3');

    // Rerender with large size
    rerender(<DeleteButton onClick={() => {}} size="lg" />);
    button = screen.getByRole('button');
    icon = screen.getByTestId('trash-icon');
    expect(button).toHaveClass('p-2'); // same padding for md and lg
    expect(icon).toHaveClass('h-5', 'w-5');
  });
});
