/**
 * ShieldShaderDynamic — dynamic import wrapper for ShieldShader.
 *
 * Use this export on the Analyzing view so that the WebGL shader code is
 * absent from every other route's bundle (DD §6 / Task 5.2 acceptance criteria).
 *
 * Usage:
 *   import { ShieldShaderDynamic } from '@/components/ShieldShaderDynamic';
 *   <ShieldShaderDynamic />
 *
 * The loading prop accepts a placeholder rendered while the chunk downloads.
 * Defaults to a minimal surface-container-high block matching the 96px well.
 */
import dynamic from 'next/dynamic';
import React from 'react';

export const ShieldShaderDynamic = dynamic(
  () => import('./ShieldShader').then((m) => ({ default: m.ShieldShader })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-24 h-24 rounded-full bg-surface-container-high"
        aria-hidden="true"
        data-testid="shield-shader-loading"
      />
    ),
  },
);
