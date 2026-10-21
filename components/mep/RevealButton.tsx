import { Button } from '@/components/ui';

// "Click to reveal" for lists fetched live from the Sejm API: nothing is
// requested until the visitor asks, which keeps page loads light on the API.
export function RevealButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" className="w-full" onClick={onClick}>
      {label}
    </Button>
  );
}
