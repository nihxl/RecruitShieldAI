export default function Home() {
  return (
    <main className="min-h-screen bg-surface p-margin-desktop space-y-xl">
      <section>
        <h1 className="text-h1-desktop text-primary font-bold">RecruitShield AI Tokens</h1>
        <p className="text-body-lg text-on-surface-variant mt-base">
          This page demonstrates the design tokens defined in our theme.
        </p>
      </section>

      <section className="space-y-md">
        <h2 className="text-h2-desktop text-on-surface font-semibold">Typography</h2>
        <div className="space-y-sm bg-surface-container-low p-md rounded-card shadow-level-1">
          <p className="text-h1-desktop text-on-surface font-bold">h1-desktop: 48px</p>
          <p className="text-h1-mobile text-on-surface font-bold">h1-mobile: 32px</p>
          <p className="text-h2-desktop text-on-surface font-semibold">h2-desktop: 36px</p>
          <p className="text-h3-desktop text-on-surface font-semibold">h3-desktop: 24px</p>
          <p className="text-body-lg text-on-surface">body-lg: 18px</p>
          <p className="text-body-md text-on-surface">body-md: 16px</p>
          <p className="text-body-sm text-on-surface">body-sm: 14px</p>
          <p className="text-label-caps text-on-surface uppercase font-semibold">label-caps: 12px</p>
        </div>
      </section>

      <section className="space-y-md">
        <h2 className="text-h2-desktop text-on-surface font-semibold">Colors & Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="bg-surface-container-low p-md rounded-card shadow-level-1 border border-outline flex items-center justify-center">
            <span className="text-on-surface text-body-md">Card (24px)</span>
          </div>
          <div className="bg-primary p-md rounded-item flex items-center justify-center">
            <span className="text-on-primary text-body-md font-bold">Primary Item (12px)</span>
          </div>
          <div className="bg-secondary p-sm rounded-control flex items-center justify-center">
            <span className="text-on-secondary text-body-md font-semibold">Secondary Control (8px)</span>
          </div>
          <div className="bg-error p-sm rounded-pill flex items-center justify-center">
            <span className="text-on-error text-body-sm font-bold">Error Pill</span>
          </div>
        </div>
      </section>
      
      <section className="space-y-md">
        <h2 className="text-h2-desktop text-on-surface font-semibold">Status Map</h2>
        <div className="flex gap-base flex-wrap">
          <div className="bg-secondary/15 border border-secondary/40 text-secondary px-sm py-xs rounded-pill flex items-center gap-xs">
            <span className="text-label-caps">Highly Genuine</span>
          </div>
          <div className="bg-tertiary/15 border border-tertiary/40 text-tertiary px-sm py-xs rounded-pill flex items-center gap-xs">
            <span className="text-label-caps">Caution Advised</span>
          </div>
          <div className="bg-error/15 border border-error/40 text-error px-sm py-xs rounded-pill flex items-center gap-xs">
            <span className="text-label-caps">High Risk</span>
          </div>
          <div className="bg-surface border border-outline text-on-surface-variant px-sm py-xs rounded-pill flex items-center gap-xs">
            <span className="text-label-caps">Locked</span>
          </div>
        </div>
      </section>
    </main>
  );
}
