import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { FloorPlanAnalysis } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface AnalysisViewProps {
  plan: FloorPlanAnalysis;
}

const severityConfig = {
  critical: { icon: AlertOctagon, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10', label: 'Warning' },
  info: { icon: Info, color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info))]/10', label: 'Info' },
};

const qualityColors: Record<string, string> = {
  Excellent: 'bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]',
  Good: 'bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]',
  Fair: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]',
  Poor: 'bg-destructive/15 text-destructive',
};

const dqiColor = (s: number) => {
  if (s >= 85) return 'text-[hsl(var(--success))]';
  if (s >= 70) return 'text-[hsl(var(--info))]';
  if (s >= 55) return 'text-[hsl(var(--warning))]';
  return 'text-destructive';
};

export function AnalysisView({ plan }: AnalysisViewProps) {
  const { sendMessage } = useAppStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [plan.chatHistory.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(plan.id, input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-6 md:px-8 py-6 space-y-4">
          {/* SVG preview */}
          {plan.svgContent && (
            <div className="w-14 h-14 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center p-1.5 ml-auto">
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full text-foreground"
                dangerouslySetInnerHTML={{ __html: plan.svgContent }}
              />
            </div>
          )}

          <h3 className="text-lg font-semibold text-foreground">
            Insights — {plan.name}
          </h3>

          {/* Metrics row — clean text only */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{plan.roomCount}</span>
              <span className="text-xs text-muted-foreground">Rooms</span>
            </div>
            <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{plan.totalArea}</span>
              <span className="text-xs text-muted-foreground">m² Total</span>
            </div>
            <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold', dqiColor(plan.dqiScore))}>{plan.dqiScore}</span>
              <span className="text-xs text-muted-foreground">DQI Score</span>
              <span
                className={cn(
                  'text-[10px] font-medium px-2 py-0.5 rounded-full mt-1',
                  qualityColors[plan.qualityClass]
                )}
              >
                {plan.qualityClass}
              </span>
            </div>
          </div>

          {/* Room breakdown */}
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

          {/* Suggestions */}
          <div className="rounded-lg bg-card border border-border p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Suggestions</h4>
            <div className="space-y-2">
              {plan.suggestions.map((s, i) => {
                const config = severityConfig[s.severity];
                const Icon = config.icon;
                return (
                  <div key={i} className={cn('flex gap-2 p-2.5 rounded-md text-sm', config.bg)}>
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                    <span className="text-foreground">{s.message}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat messages */}
          {plan.chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat input */}
      <div className="px-6 md:px-8 py-4 border-t border-border">
        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about this floor plan..."
            className="w-full h-12 pl-4 pr-12 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}