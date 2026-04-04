import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { FloorPlanAnalysis } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { useAskQuestion } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

interface AnalysisViewProps {
  planId: string; // Change from plan to planId
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
  Average: 'bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))]', // Use amber/neutral color for Average
};

const dqiColor = (s: number) => {
  if (s >= 85) return 'text-[hsl(var(--success))]';
  if (s >= 70) return 'text-[hsl(var(--info))]';
  if (s >= 55) return 'text-[hsl(var(--warning))]';
  return 'text-destructive';
};

export function AnalysisView({ planId }: AnalysisViewProps) {
  const { updatePlan } = useAppStore();
  const { mutate: askQuestion, isPending } = useAskQuestion();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use selector to get current plan from store
  const plan = useAppStore((state) => state.plans.find(p => p.id === planId));

  // Handle case where plan is not found
  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Plan not found</h3>
          <p className="text-muted-foreground">The selected floor plan could not be loaded.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [plan.chatHistory.length]);

  const handleSend = () => {
    console.log('=== CHAT DEBUG ===');
    console.log('Input:', input.trim());
    console.log('Plan sessionId:', plan.sessionId);
    console.log('Plan ID:', plan.id);
    console.log('isPending:', isPending);
    
    if (!input.trim()) {
      console.log('Returning early: empty input');
      return;
    }
    
    // For demo mode or plans without session, use store's sendMessage
    if (!plan.sessionId) {
      console.log('Using demo mode sendMessage');
      // This will use the store's demo logic
      const { sendMessage } = useAppStore.getState();
      sendMessage(plan.id, input.trim());
      setInput('');
      return;
    }
    
    console.log('Calling askQuestion with:', { sessionId: plan.sessionId, question: input.trim() });
    
    // Add user message to local state immediately for better UX
    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    // Update plan with new message
    console.log('Updating plan with user message');
    updatePlan(plan.id, {
      chatHistory: [...plan.chatHistory, userMsg],
    });
    
    // Auto-scroll to bottom after adding user message
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
    
    askQuestion({ sessionId: plan.sessionId, question: input.trim(), planId: plan.id });
    setInput('');
    console.log('=== END CHAT DEBUG ===');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} data-chat-container className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-4">
          {/* SVG preview */}
          {plan.svgContent && (
            <div className="w-20 h-20 rounded-xl border-2 border-border bg-card shadow-sm overflow-hidden flex items-center justify-center p-2 ml-auto">
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
              <span className="text-2xl font-bold text-foreground">{plan.totalArea.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">m² Total</span>
            </div>
            <div className="rounded-lg bg-card border border-border p-4 flex flex-col items-center justify-center">
              <span className={cn('text-2xl font-bold', dqiColor(plan.dqiScore))}>{plan.dqiScore.toFixed(1)}</span>
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
                    <div className="flex-1">
                      {s.title && (
                        <div className="font-medium text-foreground mb-1">{s.title}</div>
                      )}
                      <div className="text-muted-foreground">{s.message}</div>
                      {/* Show metric and value if available (from backend suggestions) */}
                      {s.metric && s.value && (
                        <div className="flex gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                            {s.metric}: {s.value}
                          </span>
                        </div>
                      )}
                    </div>
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
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat input */}
      <div className="px-4 md:px-6 py-4 border-t border-border">
        {/* Thinking indicator */}
        {isPending && (
          <div className="flex items-center gap-3 mb-3 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ArchIntel is analyzing...</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              plan.sessionId 
                ? "Ask anything about this floor plan..." 
                : "Session expired. Please upload the floorplan again."
            }
            disabled={!plan.sessionId}
            className="w-full h-12 pl-4 pr-12 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 transition-shadow disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isPending || !plan.sessionId}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}