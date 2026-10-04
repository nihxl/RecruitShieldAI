import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HighlightedPhrase } from '@/components/HighlightedPhrase';

describe('HighlightedPhrase – span normalisation', () => {
  it('renders plain text when spans array is empty', () => {
    render(<HighlightedPhrase text="hello world" spans={[]} />);
    expect(screen.getByText('hello world')).toBeTruthy();
    expect(document.querySelector('mark')).toBeNull();
  });

  it('renders a single span correctly', () => {
    render(<HighlightedPhrase text="hello world" spans={[{ start: 6, end: 11 }]} />);
    const mark = document.querySelector('mark');
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe('world');
  });

  it('handles a span touching the start (start=0)', () => {
    render(<HighlightedPhrase text="hello world" spans={[{ start: 0, end: 5 }]} />);
    const mark = document.querySelector('mark');
    expect(mark?.textContent).toBe('hello');
  });

  it('handles a span touching the end (end=text.length)', () => {
    render(<HighlightedPhrase text="hello world" spans={[{ start: 6, end: 11 }]} />);
    const mark = document.querySelector('mark');
    expect(mark?.textContent).toBe('world');
  });

  it('merges adjacent (touching) spans into one highlight', () => {
    // spans [0,5) and [5,11) are adjacent — should merge to [0,11)
    render(<HighlightedPhrase text="hello world" spans={[{ start: 0, end: 5 }, { start: 5, end: 11 }]} />);
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('hello world');
  });

  it('merges overlapping spans', () => {
    // [2,7) and [4,10) overlap — should merge to [2,10)
    render(<HighlightedPhrase text="abcdefghij" spans={[{ start: 2, end: 7 }, { start: 4, end: 10 }]} />);
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe('cdefghij');
  });

  it('keeps two non-adjacent spans as separate highlights', () => {
    render(<HighlightedPhrase text="hello world foo" spans={[{ start: 0, end: 5 }, { start: 6, end: 11 }]} />);
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe('hello');
    expect(marks[1].textContent).toBe('world');
  });

  it('silently drops out-of-range spans', () => {
    render(<HighlightedPhrase text="hello" spans={[{ start: 10, end: 20 }]} />);
    expect(document.querySelector('mark')).toBeNull();
  });

  it('silently drops empty spans (start >= end)', () => {
    render(<HighlightedPhrase text="hello" spans={[{ start: 3, end: 3 }]} />);
    expect(document.querySelector('mark')).toBeNull();
  });

  it('clamps partially out-of-range spans to text bounds', () => {
    render(<HighlightedPhrase text="hello" spans={[{ start: 3, end: 100 }]} />);
    const mark = document.querySelector('mark');
    expect(mark?.textContent).toBe('lo');
  });

  it('handles unsorted span order correctly', () => {
    // Spans in reverse order — should still produce correct highlights
    render(<HighlightedPhrase text="abcdef" spans={[{ start: 4, end: 6 }, { start: 0, end: 2 }]} />);
    const marks = document.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe('ab');
    expect(marks[1].textContent).toBe('ef');
  });
});

describe('HighlightedPhrase – XSS / HTML safety', () => {
  it('renders user text containing <script> as plain text, not HTML', () => {
    const evil = 'safe <script>alert(1)</script> text';
    render(<HighlightedPhrase text={evil} spans={[]} />);
    // No script element should exist in the DOM
    expect(document.querySelector('script')).toBeNull();
    // The full string including the raw angle brackets should be visible as text
    expect(screen.getByText(evil)).toBeTruthy();
  });

  it('renders user text containing HTML tags as plain text', () => {
    const evil = '<img src=x onerror=alert(1)>';
    render(<HighlightedPhrase text={evil} spans={[]} />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText(evil)).toBeTruthy();
  });

  it('renders highlighted spans containing HTML as plain text', () => {
    const evil = '<b>bold</b>';
    render(<HighlightedPhrase text={evil} spans={[{ start: 0, end: evil.length }]} />);
    // Should have exactly one <mark> containing the literal string
    const mark = document.querySelector('mark');
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe(evil);
    // No extra <b> element
    expect(document.querySelector('b')).toBeNull();
  });
});

describe('HighlightedPhrase – long-word case', () => {
  it('renders a very long word spanning the whole text', () => {
    const longWord = 'supercalifragilisticexpialidocious'.repeat(10);
    render(<HighlightedPhrase text={longWord} spans={[{ start: 0, end: 20 }]} />);
    const mark = document.querySelector('mark');
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe(longWord.slice(0, 20));
  });
});
