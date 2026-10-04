'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Accordion, AccordionItem } from '@/components/Accordion';
import { MICROCOPY } from '@/lib/constants';

export default function VerifyPage({ appMode }: { appMode?: string }) {
  const router = useRouter();
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');

  React.useEffect(() => {
    const savedText = sessionStorage.getItem('rs_draft_jobText');
    if (savedText) setJobText(savedText);
    const savedTitle = sessionStorage.getItem('rs_draft_jobTitle');
    if (savedTitle) setJobTitle(savedTitle);
    const savedCompany = sessionStorage.getItem('rs_draft_companyName');
    if (savedCompany) setCompanyName(savedCompany);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Split MICROCOPY.verifyHero by the first period
  const splitHero = MICROCOPY.verifyHero.split('. ');
  const heroTitle = splitHero[0] + '.';
  const heroLead = splitHero.slice(1).join('. ');

  const isValid = jobText.length >= 100 && jobText.length <= 5000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    sessionStorage.setItem('rs_draft_jobText', jobText);
    sessionStorage.setItem('rs_draft_jobTitle', jobTitle);
    sessionStorage.setItem('rs_draft_companyName', companyName);

    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobText,
          jobTitle: jobTitle.trim() || undefined,
          companyName: companyName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(MICROCOPY.analysisFailed);
      }

      const data = await res.json();
      router.push(`/results/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : MICROCOPY.analysisFailed);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center w-full">
      <section className="w-full bg-surface-container-lowest pt-20 pb-[120px] px-4 md:px-10 relative overflow-hidden flex justify-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--color-primary) 0%, transparent 50%)' }} />
        <div className="max-w-3xl text-center relative z-10 w-full">
          <h1 className="font-h1-mobile text-h1-mobile md:font-h1-desktop md:text-h1-desktop text-primary mb-6">{heroTitle}</h1>
          <p className="font-body-lg text-body-lg text-on-surface mb-8">{heroLead}</p>
        </div>
      </section>

      <section className="w-full px-4 md:px-10 -mt-[80px] pb-20 relative z-20 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-[672px] bg-surface-container-low rounded-[var(--radius-card)] shadow-[var(--shadow-level-2)] overflow-hidden border border-surface-variant flex flex-col">
          {/* demo_full only: analysis readiness */}
          {appMode === 'demo_full' && (
            <div className="p-6 border-b border-surface-variant bg-surface-container-low/90 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Analysis Readiness</span>
                <span className="font-body-sm text-body-sm text-primary font-semibold">1 of 4 checks added</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full w-1/4 transition-all duration-500 ease-in-out" />
              </div>
            </div>
          )}

          <Accordion type="single" defaultValue="job-post" collapsible className="w-full">
            <AccordionItem value="job-post" title="Job post text" subtitle="Paste the full description" icon="description">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      label="Job title (optional)"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Untitled posting"
                      maxLength={120}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Company name (optional)"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company not provided"
                      maxLength={120}
                    />
                  </div>
                </div>
                <Textarea
                  label="Job Description"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="Paste the job description here..."
                  maxLength={5000}
                  className="min-h-[128px] max-h-[320px] resize-y w-full"
                  error={error ? error : undefined}
                  id="job-text-input"
                />
              </div>
            </AccordionItem>
            
            <AccordionItem value="offer-letter" title="Offer letter" subtitle="Not added yet" icon="upload_file" variant="locked" />
            <AccordionItem value="recruiter-email" title="Recruiter email" subtitle="Not added yet" icon="mail" variant="locked" />
            <AccordionItem value="link-qr" title="Link or QR code" subtitle="Not added yet" icon="link" variant="locked" />
          </Accordion>

          <div className="p-6 bg-surface-container-low border-t border-surface-variant flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                {MICROCOPY.privacyLine.replace(' Privacy Policy', '')} <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                Note: Our model works best on English text, but other languages are not blocked.
              </p>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              className="w-full py-4 text-button flex items-center justify-center gap-2"
              icon="security"
              iconFilled
              isLoading={isSubmitting}
            >
              Check Now
            </Button>
            
            {!isValid && jobText.length > 0 && (
              <p className="font-body-sm text-body-sm text-error text-center" role="alert">
                {MICROCOPY.shortInputError}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
