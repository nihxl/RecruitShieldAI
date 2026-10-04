import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VerifyClient from '../VerifyClient';
import { MICROCOPY } from '@/lib/constants';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('VerifyClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn() as any;
  });

  it('renders correctly', () => {
    render(<VerifyClient />);
    expect(screen.getByRole('button', { name: /Check Now/i })).toBeInTheDocument();
  });

  it('blocks submission if text is under 100 characters', async () => {
    render(<VerifyClient />);
    
    const textarea = screen.getByLabelText(/Job Description/i);
    fireEvent.change(textarea, { target: { value: 'Too short' } });
    
    const button = screen.getByRole('button', { name: /Check Now/i });
    expect(button).toBeDisabled();
    
    expect(screen.getByText(MICROCOPY.shortInputError)).toBeInTheDocument();
  });

  it('allows submission if text is over 100 characters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'RS-1234-ABC' })
    });

    render(<VerifyClient />);
    
    const textarea = screen.getByLabelText(/Job Description/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(150) } });
    
    const button = screen.getByRole('button', { name: /Check Now/i });
    expect(button).not.toBeDisabled();
    
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(global.fetch).toHaveBeenCalled();
  });
});
