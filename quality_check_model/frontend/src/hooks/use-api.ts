import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiClient } from '@/lib/api';
import { useAppStore } from '@/lib/store';

// Query keys
export const apiKeys = {
  health: ['health'] as const,
  analysis: (sessionId: string) => ['analysis', sessionId] as const,
};

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: apiKeys.health,
    queryFn: () => getApiClient().healthCheck(),
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
}

// Analyze SVG hook
export function useAnalyzeSvg() {
  const queryClient = useQueryClient();
  const { addPlan, setActivePlan, setIsAnalyzing, settings } = useAppStore();

  return useMutation({
    mutationFn: async ({ name, file }: { name: string; file: File }) => {
      if (settings.demoMode) {
        throw new Error('Cannot use real API in demo mode');
      }
      
      const response = await getApiClient().analyzeSvg(file);
      return { name, response };
    },
    onMutate: () => {
      setIsAnalyzing(true);
    },
    onSuccess: ({ name, response }) => {
      console.log('Analyze SVG success hook called with:', { name, response });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Analysis failed');
      }

      const { session_id, summary, suggestions } = response.data;
      console.log('Extracted data:', { session_id, summary, suggestions });
      
      // Convert backend response to frontend format
      const newPlan = {
        id: `plan-${Date.now()}`,
        name,
        timestamp: Date.now(),
        svgContent: '', // Will be set by the upload component
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

      console.log('Created new plan:', newPlan);

      // Save to store and localStorage
      addPlan(newPlan);
      setActivePlan(newPlan.id);
      
      // Save to localStorage for persistence
      const existingPlans = JSON.parse(localStorage.getItem('archintel-plans') || '[]');
      existingPlans.unshift(newPlan);
      localStorage.setItem('archintel-plans', JSON.stringify(existingPlans));

      toast.success(`Floor plan analyzed! Found ${summary.num_rooms} rooms, ${summary.total_area}m² total area, DQI: ${summary.dqi_score}`);
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze floor plan');
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });
}

// Ask question hook
export function useAskQuestion() {
  const { updatePlan, settings } = useAppStore();

  return useMutation({
    mutationFn: async ({ sessionId, question, planId }: { sessionId: string; question: string; planId: string }) => {
      console.log('=== USE-ASK-QUESTION DEBUG ===');
      console.log('Mutation called with:', { sessionId, question, planId });
      console.log('Demo mode:', settings.demoMode);
      
      if (settings.demoMode) {
        console.log('Throwing error: Demo mode is ON');
        throw new Error('Cannot use real API in demo mode');
      }

      console.log('Calling getApiClient().askQuestion...');
      const response = await getApiClient().askQuestion(sessionId, question);
      console.log('Got response:', response);
      return { response, planId };
    },
    onSuccess: ({ response, planId }) => {
      console.log('Ask question success hook called with:', { response, planId });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get response');
      }

      const assistantMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: response.data.answer,
        timestamp: Date.now(),
      };

      console.log('Adding assistant message:', assistantMessage);

      // Add assistant message to plan using planId
      const currentPlan = useAppStore.getState().plans.find(p => p.id === planId);
      if (currentPlan) {
        updatePlan(planId, {
          chatHistory: [...currentPlan.chatHistory, assistantMessage],
        });
        
        // Auto-scroll to bottom after assistant response
        setTimeout(() => {
          const chatContainer = document.querySelector('[data-chat-container]');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      if (error instanceof Error && error.message.includes('session')) {
        toast.error('Session expired. Please upload the floorplan again.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to send message');
      }
    },
  });
}

// Reset session hook
export function useResetSession() {
  const queryClient = useQueryClient();
  const { newChat } = useAppStore();

  return useMutation({
    mutationFn: async () => {
      const response = await getApiClient().resetSession();
      return response;
    },
    onSuccess: () => {
      newChat();
      queryClient.clear();
      toast.success('Conversation reset successfully');
    },
    onError: (error) => {
      console.error('Reset error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset conversation');
    },
  });
}
