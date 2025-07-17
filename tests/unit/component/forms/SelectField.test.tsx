import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectField from '@/components/dashboard/forms/SelectField';

// utilities
const baseProps = {
  label: 'Country',
  name: 'country',
  value: '',
  onChange: jest.fn(),
  options: [
    { value: 'fr', label: 'France' },
    { value: 'de', label: 'Germany' },
  ],
};

describe('<SelectField />', () => {
  it('renders the label and placeholder', () => {
    render(<SelectField {...baseProps} />);
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /sélectionner une option/i }),
    ).toBeDisabled();
  });

  it('renders required asterisk when required prop is true', () => {
    render(<SelectField {...baseProps} required />);
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });

  it('lists all provided options', () => {
    render(<SelectField {...baseProps} />);
    baseProps.options.forEach(({ label }) => {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument();
    });
  });

  it('calls onChange with the selected value', async () => {
    const user = userEvent.setup();
    render(<SelectField {...baseProps} />);
    await user.selectOptions(
      screen.getByRole('combobox'),
      screen.getByRole('option', { name: /germany/i }),
    );
    expect(baseProps.onChange).toHaveBeenCalledWith('de');
  });

  it('accepts an external className', () => {
    render(<SelectField {...baseProps} className="my-custom-class" />);
    expect(screen.getByText(/country/i).closest('div')).toHaveClass(
      'my-custom-class',
    );
  });

  it('reflects the controlled value prop', () => {
    const { rerender } = render(<SelectField {...baseProps} value="fr" />);
    // first render shows France selected
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('fr');

    // update prop, component should reflect new value
    rerender(<SelectField {...baseProps} value="de" />);
    expect(select.value).toBe('de');
  });
});
