/**
 * Tests for the Icon component.
 * Requirements: TS §3 (Icons), TS §8 (CSP), DD §11, D-7
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Icon, type IconName } from '@/components/Icon';

const ALL_ICONS: IconName[] = [
  'shield_person', 'shield', 'verified', 'check_circle', 'warning',
  'gpp_maybe', 'lock', 'science', 'error', 'info', 'expand_more',
  'chevron_right', 'arrow_back', 'add_circle', 'security',
  'progress_activity', 'search', 'download', 'print', 'menu',
  'close', 'delete', 'more_vert', 'chat', 'mail',
];

describe('Icon component', () => {
  it('renders an SVG element with correct viewBox', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 -960 960 960');
  });

  it('has aria-hidden="true" for accessibility', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('has focusable="false" to prevent tab-focus on SVG', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('defaults to 24px size (reserved box, DD §11)', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('accepts a custom size', () => {
    const { container } = render(<Icon name="shield" size={48} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('applies the rs-icon className by default', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('rs-icon');
  });

  it('appends custom className', () => {
    const { container } = render(<Icon name="shield" className="custom" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('rs-icon');
    expect(svg).toHaveClass('custom');
  });

  it('renders outlined variant by default', () => {
    const { container: outlined } = render(<Icon name="shield" />);
    const { container: filled } = render(<Icon name="shield" filled />);
    // Outlined and filled should have different inner SVG path data
    const outlinedPath = outlined.querySelector('svg path')?.getAttribute('d');
    const filledPath = filled.querySelector('svg path')?.getAttribute('d');
    expect(outlinedPath).toBeTruthy();
    expect(filledPath).toBeTruthy();
    expect(outlinedPath).not.toBe(filledPath);
  });

  it('renders all 25 required icons in outlined variant without error', () => {
    ALL_ICONS.forEach((name) => {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Should contain at least one path element
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });
  });

  it('renders all 25 required icons in filled variant without error', () => {
    ALL_ICONS.forEach((name) => {
      const { container } = render(<Icon name={name} filled />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });
  });

  it('has flexShrink: 0 to prevent layout shift (DD §11)', () => {
    const { container } = render(<Icon name="shield" />);
    const svg = container.querySelector('svg');
    expect(svg?.style.flexShrink).toBe('0');
  });

  it('passes through additional SVG props', () => {
    const { container } = render(
      <Icon name="shield" data-testid="test-icon" role="img" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-testid', 'test-icon');
    expect(svg).toHaveAttribute('role', 'img');
  });

  it('merges custom style with flexShrink', () => {
    const { container } = render(
      <Icon name="shield" style={{ color: 'red' }} />
    );
    const svg = container.querySelector('svg');
    expect(svg?.style.flexShrink).toBe('0');
    expect(svg?.style.color).toBe('red');
  });
});
