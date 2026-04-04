import { useState } from 'react';
import {
  Search, PenLine, GitCompareArrows, ChevronLeft, ChevronRight,
  Hexagon, Trash2, Clock, Sun, Moon, Zap, RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useResetSession } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AppSidebar() {
  const {
    plans, activePlanId, sidebarOpen, toggleSidebar,
    setActivePlan, newChat, deletePlan, settings, updateSettings,
  } = useAppStore();
  const { mutate: resetSession } = useResetSession();
  const [search, setSearch] = useState('');

  const filtered = plans.filter((p) => {
    const searchTerm = search.toLowerCase();
    if (!searchTerm) return true;
    
    // Search in plan name
    if (p.name.toLowerCase().includes(searchTerm)) return true;
    
    // Search in suggestions
    return p.suggestions.some(s => 
      s.message.toLowerCase().includes(searchTerm) || 
      (s.title && s.title.toLowerCase().includes(searchTerm))
    );
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const toggleDemoMode = () => {
    updateSettings({ demoMode: !settings.demoMode });
  };

  if (!sidebarOpen) {
    return (
      <div className="w-12 h-screen flex flex-col items-center py-4 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] shrink-0">
        <Hexagon className="h-6 w-6 text-primary mb-4" />
        <div className="flex flex-col gap-1 items-center">
          <button
            onClick={() => { toggleSidebar(); }}
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => { newChat(); }}
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
            aria-label="New Chat"
          >
            <PenLine className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
            aria-label="Compare Floor Plans"
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex flex-col gap-1 items-center">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-muted-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
            aria-label="Open sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 h-screen flex flex-col bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <Hexagon className="h-6 w-6 text-primary" />
        <span className="text-base font-semibold text-foreground tracking-tight">
          ArchIntel
        </span>
      </div>

      {/* Actions */}
      <div className="px-3 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-sm rounded-md bg-secondary border-none outline-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
          />
        </div>

        <button
          onClick={newChat}
          className="w-full flex items-center gap-2 px-3 h-8 text-sm rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
        >
          <PenLine className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>

        <button className="w-full flex items-center gap-2 px-3 h-8 text-sm rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors">
          <GitCompareArrows className="h-3.5 w-3.5" />
          <span>Compare Floor Plans</span>
        </button>

        <button
          onClick={() => resetSession()}
          className="w-full flex items-center gap-2 px-3 h-8 text-sm rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Conversation</span>
        </button>

        <button
          onClick={toggleDemoMode}
          className={cn(
            'w-full flex items-center gap-2 px-3 h-8 text-sm rounded-md transition-colors',
            settings.demoMode 
              ? 'bg-primary/10 text-primary hover:bg-primary/20' 
              : 'hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))]'
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{settings.demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}</span>
        </button>
      </div>

      {/* Recents */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        <div className="flex items-center gap-1.5 px-2 mb-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recents
          </span>
        </div>
        <div className="space-y-0.5">
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                activePlanId === plan.id
                  ? 'bg-[hsl(var(--sidebar-active))] text-primary font-medium'
                  : 'text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-hover))]'
              )}
              onClick={() => setActivePlan(plan.id)}
            >
              <div className="truncate flex-1">
                <div className="truncate">{plan.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {formatTime(plan.timestamp)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast(`Delete "${plan.name}"?`, {
                    action: {
                      label: 'Delete',
                      onClick: () => deletePlan(plan.id),
                    },
                    cancel: {
                      label: 'Cancel',
                    },
                  });
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                aria-label={`Delete ${plan.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">
              No plans found
            </p>
          )}
        </div>
      </div>

      {/* Bottom: theme toggle + collapse */}
      <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))] flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-fg))] transition-colors"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
