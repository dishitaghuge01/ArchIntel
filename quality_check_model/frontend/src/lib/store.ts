import { create } from 'zustand';
import { FloorPlanAnalysis, ChatMessage, AppSettings } from './types';
import { DEMO_PLANS, DEMO_CHAT_RESPONSES } from './demo-data';

interface AppState {
  plans: FloorPlanAnalysis[];
  activePlanId: string | null;
  sidebarOpen: boolean;
  isAnalyzing: boolean;
  settings: AppSettings;

  // Actions
  setActivePlan: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addPlan: (plan: FloorPlanAnalysis) => void;
  updatePlan: (id: string, updates: Partial<FloorPlanAnalysis>) => void;
  deletePlan: (id: string) => void;
  setIsAnalyzing: (v: boolean) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  sendMessage: (planId: string, content: string) => void;
  analyzeSvg: (name: string, svgContent: string) => void;
  newChat: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('archintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

export const useAppStore = create<AppState>((set, get) => ({
  plans: DEMO_PLANS,
  activePlanId: null,
  sidebarOpen: true,
  isAnalyzing: false,
  settings: {
    demoMode: true,
    apiBaseUrl: 'http://localhost:8000',
    theme: getInitialTheme(),
  },

  setActivePlan: (id) => set({ activePlanId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addPlan: (plan) => set((s) => ({ plans: [plan, ...s.plans] })),
  updatePlan: (id, updates) =>
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deletePlan: (id) =>
    set((s) => ({
      plans: s.plans.filter((p) => p.id !== id),
      activePlanId: s.activePlanId === id ? null : s.activePlanId,
    })),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  updateSettings: (s) =>
    set((state) => {
      const newSettings = { ...state.settings, ...s };
      if (s.theme) {
        localStorage.setItem('archintel-theme', s.theme);
        document.documentElement.classList.toggle('dark', s.theme === 'dark');
      }
      return { settings: newSettings };
    }),

  newChat: () => set({ activePlanId: null }),

  sendMessage: (planId, content) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set((s) => ({
      plans: s.plans.map((p) =>
        p.id === planId ? { ...p, chatHistory: [...p.chatHistory, userMsg] } : p
      ),
    }));

    // Simulate assistant response
    setTimeout(() => {
      const lc = content.toLowerCase();
      let response = DEMO_CHAT_RESPONSES.default;
      if (lc.includes('room')) response = DEMO_CHAT_RESPONSES.room;
      else if (lc.includes('improve') || lc.includes('suggest'))
        response = DEMO_CHAT_RESPONSES.improve;
      else if (lc.includes('dqi') || lc.includes('score') || lc.includes('quality'))
        response = DEMO_CHAT_RESPONSES.dqi;
      else if (lc.includes('area') || lc.includes('size'))
        response = DEMO_CHAT_RESPONSES.area;

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      set((s) => ({
        plans: s.plans.map((p) =>
          p.id === planId
            ? { ...p, chatHistory: [...p.chatHistory, assistantMsg] }
            : p
        ),
      }));
    }, 800);
  },

  analyzeSvg: (name, svgContent) => {
    set({ isAnalyzing: true });

    setTimeout(() => {
      const dqi = Math.floor(Math.random() * 30) + 60;
      const newPlan: FloorPlanAnalysis = {
        id: `plan-${Date.now()}`,
        name,
        timestamp: Date.now(),
        svgContent,
        totalArea: Math.floor(Math.random() * 200) + 40,
        roomCount: Math.floor(Math.random() * 5) + 2,
        rooms: [
          { name: 'Room A', area: Math.floor(Math.random() * 30) + 15 },
          { name: 'Room B', area: Math.floor(Math.random() * 20) + 10 },
          { name: 'Room C', area: Math.floor(Math.random() * 15) + 8 },
        ],
        dqiScore: dqi,
        qualityClass: dqi >= 85 ? 'Excellent' : dqi >= 70 ? 'Good' : dqi >= 55 ? 'Fair' : 'Poor',
        suggestions: [
          { severity: 'info', message: 'Layout analysis complete. Room proportions appear balanced.' },
          { severity: 'warning', message: 'Consider improving natural ventilation pathways.' },
        ],
        chatHistory: [],
      };

      set((s) => ({
        plans: [newPlan, ...s.plans],
        activePlanId: newPlan.id,
        isAnalyzing: false,
      }));
    }, 2000);
  },
}));
