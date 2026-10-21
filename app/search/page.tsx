'use client';

import { useMeps, useClubs } from '@/hooks/useMeps';
import MepList from '@/components/meps/MepList';
import { Mep } from '@/types/mep';
import { ErrorState, LoadingState, Page, PageHeader } from '@/components/ui';

export default function SearchPage() {
  const { meps, loading: mepsLoading, error: mepsError } = useMeps();
  const { clubs, loading: clubsLoading } = useClubs();

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Posłowie"
        title="Posłanki i posłowie X kadencji"
        description="Znajdź swojego posła po nazwisku, okręgu lub zawodzie i sprawdź, jak pracuje."
      />

      {mepsLoading || clubsLoading ? (
        <LoadingState />
      ) : mepsError ? (
        <ErrorState title="Błąd ładowania danych" message={mepsError} />
      ) : (
        <MepList meps={meps as Mep[]} clubs={clubs} />
      )}
    </Page>
  );
}
