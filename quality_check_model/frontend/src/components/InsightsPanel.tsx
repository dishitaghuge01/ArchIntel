import { LayoutGrid, Ruler, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { FloorPlanAnalysis } from '@/lib/types';
import { DqiGauge } from './DqiGauge';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  plan: FloorPlanAnalysis;
  compact?: boolean;
}

const severityConfig = {
  critical: { icon: AlertOctagon, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Warning' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', label: 'Info' },
};

const qualityColors: Record<string, string> = {
  Excellent: 'bg-success/15 text-success',
  Good: 'bg-info/15 text-info',
  Fair: 'bg-warning/15 text-warning',
  Poor: 'bg-destructive/15 text-destructive',
};

export function InsightsPanel({ plan, compact }: InsightsPanelProps) {
  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center">
          <LayoutGrid className="h-5 w-5 text-primary mb-2" />
          <span className="text-2xl font-bold text-foreground">{plan.roomCount}</span>
          <span className="text-xs text-muted-foreground">Rooms</span>
        </div>
        <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center">
          <Ruler className="h-5 w-5 text-primary mb-2" />
          <span className="text-2xl font-bold text-foreground">{plan.totalArea}</span>
          <span className="text-xs text-muted-foreground">m² Total</span>
        </div>
        <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center">
          <DqiGauge score={plan.dqiScore} size={100} />
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full mt-1',
              qualityColors[plan.qualityClass]
            )}
          >
            {plan.qualityClass}
          </span>
        </div>
      </div>

      {/* Room breakdown */}
      {!compact && (
        <div className="rounded-lg bg-card border border-border p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Room Breakdown</h4>
          <div className="space-y-2">
            {plan.rooms.map((room) => (
              <div key={room.name} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{room.name}</span>
                <span className="text-muted-foreground">{room.area} m²</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="rounded-lg bg-card border border-border p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Suggestions</h4>
        <div className="space-y-2">
          {plan.suggestions.map((s, i) => {
            const config = severityConfig[s.severity];
            const Icon = config.icon;
            return (
              <div
                key={i}
                className={cn('flex gap-2 p-2.5 rounded-md text-sm', config.bg)}
              >
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                <span className="text-foreground">{s.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
