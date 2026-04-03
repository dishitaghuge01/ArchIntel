import { Loader2 } from 'lucide-react';

export function LoadingAnalysis() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <div className="text-center">
        <p className="text-foreground font-medium">Analyzing floor plan...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Detecting rooms, calculating areas, and scoring quality
        </p>
      </div>
    </div>
  );
}
