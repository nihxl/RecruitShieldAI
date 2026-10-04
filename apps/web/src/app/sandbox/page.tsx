'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { Chip } from '@/components/Chip';
import { ProgressBar } from '@/components/ProgressBar';
import { Modal } from '@/components/Modal';
import { ToastProvider, useToast } from '@/components/Toast';
import { Accordion, AccordionItem } from '@/components/Accordion';
import { Tooltip } from '@/components/Tooltip';

const SandboxContent = () => {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterSelected, setFilterSelected] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-12 bg-surface text-on-surface">
      <div>
        <h1 className="text-h1-desktop font-bold mb-8">Components Sandbox</h1>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" isLoading>Loading</Button>
          <Button variant="secondary" icon="download">With Icon</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Inputs & Textareas</h2>
        <div className="max-w-md flex flex-col gap-6">
          <Input label="Default Input" placeholder="Enter text here..." />
          <Input label="Input with Error" defaultValue="Invalid text" error="This field is required" />
          <Textarea label="Default Textarea" placeholder="Enter long text..." maxLength={500} />
          <Textarea label="Textarea with Error" defaultValue="Too short" error="Must be at least 100 characters" maxLength={5000} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Chips & Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Chip variant="status" status="Highly Genuine" label="Highly Genuine" />
          <Chip variant="status" status="Likely Genuine" label="Likely Genuine" />
          <Chip variant="status" status="Caution Advised" label="Caution Advised" />
          <Chip variant="status" status="High Risk" label="High Risk" />
          <Chip variant="status" status="Locked" label="Coming Soon" />
          <Chip variant="status" status="Simulated" label="Simulated" />
          <Chip variant="neutral" label="Neutral Badge" />
          <Chip 
            variant="filter" 
            label="Filter Selected" 
            selected={filterSelected} 
            onClick={() => setFilterSelected(!filterSelected)} 
          />
          <Chip variant="filter" label="Filter Default" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Progress Bar</h2>
        <div className="max-w-md flex flex-col gap-4">
          <ProgressBar value={25} label="25% Complete" showLabel />
          <ProgressBar value={75} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Accordion</h2>
        <div className="max-w-2xl flex flex-col bg-surface-container-low rounded-lg">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1" title="Standard Section" subtitle="This is a standard section" icon="info">
              Content for standard section.
            </AccordionItem>
            <AccordionItem value="item-2" title="Added Section" subtitle="This section has an added badge" icon="person" variant="added">
              Content for added section.
            </AccordionItem>
            <AccordionItem value="item-3" title="Locked Section" subtitle="This section is locked" icon="lock" variant="locked">
              This shouldn&apos;t be visible.
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Tooltip</h2>
        <div className="flex gap-4">
          <Tooltip content="This is a helpful tooltip message that explains something.">
            <span className="underline decoration-dotted underline-offset-4 bg-tertiary-container/15 text-on-surface hover:bg-tertiary-container/30 transition-colors p-1">Hover, focus, or tap me</span>
          </Tooltip>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2-desktop font-semibold border-b border-outline-variant pb-2">Modal & Toast</h2>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => showToast('This is a polite toast notification.')}>Show Toast</Button>
        </div>
        
        <Modal 
          open={modalOpen} 
          onOpenChange={setModalOpen}
          title="Delete this check?"
          description="This removes the report and cannot be undone."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                showToast('Check deleted');
                setModalOpen(false);
              }}>Delete</Button>
            </>
          }
        >
          <div className="text-body-md text-on-surface">Are you absolutely sure you want to proceed?</div>
        </Modal>
      </section>
    </div>
  );
};

export default function SandboxPage() {
  return (
    <ToastProvider>
      <SandboxContent />
    </ToastProvider>
  );
}
