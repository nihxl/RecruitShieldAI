import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Chip } from '../Chip';

describe('Interactive Elements', () => {
  describe('Button', () => {
    it('renders with correct text and primary variant by default', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    it('shows loading spinner and disables button when isLoading is true', () => {
      render(<Button isLoading>Loading State</Button>);
      const button = screen.getByRole('button', { name: /loading state/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      // The spinner icon replaces the icon, label stays
      expect(button).toHaveTextContent('Loading State');
      // Icon should be present
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button', { name: /secondary/i });
      expect(button).toHaveClass('border-primary');
      expect(button).toHaveClass('text-primary');
    });
  });

  describe('Input', () => {
    it('renders label and input correctly', () => {
      render(<Input label="Test Input" />);
      expect(screen.getByText('Test Input')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays error state correctly and links via aria-describedby', () => {
      render(<Input label="Test Input" error="Invalid input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
      
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      if (describedBy) {
        expect(document.getElementById(describedBy.trim())).toBeInTheDocument();
      }
    });
  });

  describe('Textarea', () => {
    it('updates character count on change and turns error color at limit', () => {
      render(<Textarea label="Description" maxLength={10} />);
      const textarea = screen.getByRole('textbox');
      
      expect(screen.getByText('0/10')).toBeInTheDocument();
      expect(screen.getByText('0/10')).not.toHaveClass('text-error');

      fireEvent.change(textarea, { target: { value: '1234567890' } });
      
      expect(screen.getByText('10/10')).toBeInTheDocument();
      expect(screen.getByText('10/10')).toHaveClass('text-error');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Chip', () => {
    it('renders status chip correctly', () => {
      render(<Chip variant="status" status="High Risk" label="Danger" />);
      expect(screen.getByText('Danger')).toBeInTheDocument();
      // High Risk should use error color
      expect(screen.getByText('Danger').parentElement).toHaveClass('text-error');
    });

    it('renders filter chip and handles selected state', () => {
      const { rerender } = render(<Chip variant="filter" label="Filter" />);
      expect(screen.getByRole('button', { name: /filter/i })).not.toHaveClass('bg-primary-container');
      
      rerender(<Chip variant="filter" label="Filter" selected />);
      expect(screen.getByRole('button', { name: /filter/i })).toHaveClass('bg-primary-container');
      expect(screen.getByRole('button', { name: /filter/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
