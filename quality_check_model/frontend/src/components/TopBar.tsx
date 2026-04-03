import { Hexagon, Sun, Moon, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { FloorPlanAnalysis } from '@/lib/types';

interface TopBarProps {
  activePlan: FloorPlanAnalysis | null;
}

export function TopBar({ activePlan }: TopBarProps) {
  const { settings, updateSettings } = useAppStore();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-card/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2">
        <Hexagon className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground tracking-tight">ArchIntel</span>
      </div>

      <div className="flex items-center gap-3">
        {/* SVG preview thumbnail */}
        {activePlan && (
          <div
            className="w-10 h-10 rounded-md border border-border bg-card overflow-hidden flex items-center justify-center p-1"
            title={activePlan.name}
          >
            <div
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full text-foreground"
              dangerouslySetInnerHTML={{ __html: activePlan.svgContent }}
            />
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
