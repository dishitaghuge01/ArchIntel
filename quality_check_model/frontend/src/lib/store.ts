import { create } from 'zustand';
import { FloorPlanAnalysis, ChatMessage, AppSettings } from './types';
import { DEMO_PLANS, DEMO_CHAT_RESPONSES } from './demo-data';
import { getApiClient } from './api';
import { toast } from 'sonner';

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
  analyzeSvg: (name: string, svgContent: string, file?: File) => Promise<void>;
  newChat: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('archintel-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
};

const getSavedPlans = (): FloorPlanAnalysis[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('archintel-plans');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
  }
  return [];
};

const getInitialPlans = (): FloorPlanAnalysis[] => {
  const state = useAppStore.getState();
  if (state?.settings?.demoMode) {
    return DEMO_PLANS;
  }
  return getSavedPlans();
};

export const useAppStore = create<AppState>((set, get) => ({
  plans: getSavedPlans(),
  activePlanId: null,
  sidebarOpen: true,
  isAnalyzing: false,
  settings: {
    demoMode: true,
    apiBaseUrl: typeof window !== 'undefined' 
      ? window.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      : 'http://localhost:8000',
    theme: getInitialTheme(),
  },

  setActivePlan: (id) => set({ activePlanId: id }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addPlan: (plan) => {
    set((s) => ({ plans: [plan, ...s.plans] }));
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const currentPlans = get().plans;
      localStorage.setItem('archintel-plans', JSON.stringify([plan, ...currentPlans]));
    }
  },
  updatePlan: (id, updates) =>
    set((s) => ({
      plans: s.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deletePlan: (id) => {
    set((s) => {
      const newPlans = s.plans.filter((p) => p.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('archintel-plans', JSON.stringify(newPlans));
      }
      return {
        plans: newPlans,
        activePlanId: s.activePlanId === id ? null : s.activePlanId,
      };
    });
  },
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  updateSettings: (s) =>
    set((state) => {
      const newSettings = { ...state.settings, ...s };
      if (s.theme) {
        localStorage.setItem('archintel-theme', s.theme);
        document.documentElement.classList.toggle('dark', s.theme === 'dark');
      }
      
      // Handle demo mode toggle
      if (s.demoMode !== undefined && s.demoMode !== state.settings.demoMode) {
        if (s.demoMode) {
          // Switch to demo mode - load demo plans
          return { 
            settings: newSettings,
            plans: DEMO_PLANS,
            activePlanId: null,
          };
        } else {
          // Switch to real mode - load saved plans
          const savedPlans = getSavedPlans();
          return { 
            settings: newSettings,
            plans: savedPlans,
            activePlanId: null,
          };
        }
      }
      
      return { settings: newSettings };
    }),

  newChat: () => set({ activePlanId: null }),

  sendMessage: async (planId, content) => {
    const state = get();
    const plan = state.plans.find(p => p.id === planId);
    
    if (!plan) return;

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

    // Use demo mode or real API
    if (state.settings.demoMode || !plan.sessionId) {
      // Demo mode - simulate response
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
    } else {
      // Real API call
      try {
        const apiClient = getApiClient();
        const response = await apiClient.askQuestion(plan.sessionId!, content);
        
        if (response.success && response.data) {
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response.data.answer,
            timestamp: Date.now(),
          };

          set((s) => ({
            plans: s.plans.map((p) =>
              p.id === planId
                ? { ...p, chatHistory: [...p.chatHistory, assistantMsg] }
                : p
            ),
          }));
        } else {
          throw new Error(response.error || 'Failed to get response');
        }
      } catch (error) {
        console.error('Chat API error:', error);
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. ' + 
            (error instanceof Error ? error.message : 'Please try again.'),
          timestamp: Date.now(),
        };

        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === planId
              ? { ...p, chatHistory: [...p.chatHistory, errorMsg] }
              : p
          ),
        }));
      }
    }
  },

  analyzeSvg: async (name, svgContent, file?: File) => {
    const state = get();
    set({ isAnalyzing: true });

    // Use demo mode or real API
    if (state.settings.demoMode || !file) {
      // Demo mode - simulate analysis
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

        // Save to localStorage
        if (typeof window !== 'undefined') {
          const currentPlans = get().plans;
          localStorage.setItem('archintel-plans', JSON.stringify([newPlan, ...currentPlans]));
        }
      }, 2000);
    } else {
      // Real API call
      try {
        const apiClient = getApiClient();
        const response = await apiClient.analyzeSvg(file);
        
        if (response.success && response.data) {
          const { session_id, summary, suggestions } = response.data;
          
          const newPlan: FloorPlanAnalysis = {
            id: `plan-${Date.now()}`,
            name,
            timestamp: Date.now(),
            svgContent,
            totalArea: summary.total_area,
            roomCount: summary.num_rooms,
            rooms: [], // Backend doesn't provide room details
            dqiScore: summary.dqi_score,
            qualityClass: summary.quality_class,
            suggestions: suggestions.map(s => ({
              severity: s.severity,
              message: s.message,
              title: s.title,
              metric: s.metric, // Include metric if available
              value: s.value, // Include value if available
            })),
            chatHistory: [],
            sessionId: session_id,
          };

          set((s) => ({
            plans: [newPlan, ...s.plans],
            activePlanId: newPlan.id,
            isAnalyzing: false,
          }));

          // Save to localStorage
          if (typeof window !== 'undefined') {
            const currentPlans = get().plans;
            localStorage.setItem('archintel-plans', JSON.stringify([newPlan, ...currentPlans]));
          }
        } else {
          throw new Error(response.error || 'Analysis failed');
        }
      } catch (error) {
        console.error('Analysis API error:', error);
        set({ isAnalyzing: false });
        toast.error(error instanceof Error ? error.message : 'Failed to analyze floor plan');
        throw error;
      }
    }
  },
}));
