'use client';

import { use } from 'react';
import { SittingView } from '@/components/sitting/SittingView';
import { EmptyState, Page } from '@/components/ui';

export default function SittingPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = use(params);
  const sitting = Number(n);
  if (!Number.isInteger(sitting) || sitting <= 0) {
    return <Page><EmptyState title="Nieprawidłowy numer posiedzenia" /></Page>;
  }
  return <SittingView sitting={sitting} />;
}
