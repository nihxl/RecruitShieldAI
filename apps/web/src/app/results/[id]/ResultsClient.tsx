'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { ErrorBlock } from '@/components/FeedbackBlocks';
import { ShieldShaderDynamic } from '@/components/ShieldShaderDynamic';
import { MICROCOPY } from '@/lib/constants';

export default function ResultsClient({ checkId, appMode }: { checkId: string, appMode?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'processing' | 'complete' | 'error' | 'not-found'>('loading');
  const [resultData, setResultData] = useState<any>(null);
  
  // Checklist states
  const [checklistStage, setChecklistStage] = useState(0); // 0: lang running, 1: lang complete
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let poller: NodeJS.Timeout;
    let timer: NodeJS.Timeout;
    
    // We want to stop the timer early if it's no longer processing
    let isProcessing = true;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/checks/${checkId}`);
        if (res.status === 404) {
          setStatus('not-found');
          isProcessing = false;
          return;
        }
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        
        if (data.status === 'processing') {
          setStatus('processing');
        } else if (data.status === 'complete') {
          setResultData(data.result);
          setStatus('complete'); // Handled by second effect for delay
        } else if (data.status === 'error') {
          setStatus('error');
          isProcessing = false;
        }
      } catch (err) {
        setStatus('error');
        isProcessing = false;
      }
    };

    if (status === 'loading' || status === 'processing') {
      fetchStatus();
      poller = setInterval(fetchStatus, 1000);
      timer = setInterval(() => {
        if (!isProcessing) return;
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= 30) {
             setStatus('error');
             isProcessing = false;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      clearInterval(poller);
      clearInterval(timer);
    };
  }, [checkId]);

  // Handle stage transitions based on elapsed time and resultData
  useEffect(() => {
    if (elapsed >= 2 && checklistStage === 0) {
      setChecklistStage(1);
    }
  }, [elapsed, checklistStage]);

  if (status === 'not-found') {
    return (
      <div className="flex-grow flex items-center justify-center p-8">
        <ErrorBlock 
          title="Not Found" 
          body="This check ID does not exist or belongs to another device."
          action={{ label: 'Return to Verify', onClick: () => router.push('/') }} 
        />
      </div>
    );
  }

  if (status === 'error' || (status === 'complete' && elapsed >= 30)) {
    return (
      <div className="flex-grow flex items-center justify-center p-8">
        <ErrorBlock 
          title="Analysis failed" 
          body={MICROCOPY.analysisFailed}
          action={{ label: 'Retry', onClick: () => router.push('/') }} 
        />
      </div>
    );
  }

  if (status === 'complete' && elapsed >= 3) {
    // Temporary stub until Task 5.4
    return (
      <div className="flex-grow flex items-center justify-center p-8 flex-col gap-4">
        <h1 className="text-h1-desktop text-primary">Results Stub</h1>
        <p className="text-body-lg text-on-surface">Score: {resultData?.trustScore}</p>
        <p className="text-body-lg text-on-surface">Band: {resultData?.band}</p>
        <Button onClick={() => {
           sessionStorage.removeItem('rs_draft_jobText');
           sessionStorage.removeItem('rs_draft_jobTitle');
           sessionStorage.removeItem('rs_draft_companyName');
           router.push('/');
        }}>Check Another</Button>
      </div>
    );
  }

  // Analyzing View
  return (
    <div className="flex-grow flex items-center justify-center w-full relative min-h-[600px] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-[480px] p-12 bg-surface-container-low rounded-[var(--radius-card)] shadow-[var(--shadow-level-2)] border border-surface-variant flex flex-col items-center relative z-10 text-center">
        
        <div className="w-[120px] h-[120px] rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 mb-8 relative">
           <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] motion-reduce:hidden" />
           <ShieldShaderDynamic />
        </div>

        <h2 className="text-h2-desktop font-bold text-on-surface mb-2">Analyzing posting</h2>
        <p className="text-body-md text-on-surface-variant mb-8">This usually takes a few seconds.</p>

        <div className="w-full text-left flex flex-col gap-4" aria-live="polite">
           {/* Checklist */}
           <div className="flex items-center gap-4 transition-opacity">
              <span className="text-[24px] material-symbols-rounded text-primary">
                 {checklistStage === 0 ? 'progress_activity' : 'check_circle'}
              </span>
              <span className="text-body-md text-on-surface font-semibold flex-grow">Language Analysis</span>
              {checklistStage === 0 && <span className="text-body-sm text-primary animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] motion-reduce:animate-none">Running...</span>}
              {checklistStage === 1 && <span className="text-body-sm text-secondary">Complete</span>}
           </div>

           {(appMode === 'demo_full' ? ['Document Check', 'Company Verification', 'Link Safety'] : ['Document Check', 'Company Verification', 'Link Safety']).map((name, i) => (
             <div key={name} className="flex items-center gap-4 opacity-50">
                <span className="text-[24px] material-symbols-rounded text-outline">lock</span>
                <span className="text-body-md text-on-surface-variant flex-grow">{name}</span>
                <span className="text-body-sm text-outline border border-outline/30 px-2 rounded-full">Coming Soon</span>
             </div>
           ))}
        </div>

        <Button variant="text" onClick={() => router.push('/')} className="mt-8 text-on-surface-variant">
          Cancel
        </Button>
      </div>
    </div>
  );
}
