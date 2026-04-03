export interface Room {
  name: string;
  area: number;
}

export interface Suggestion {
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

export interface FloorPlanAnalysis {
  id: string;
  name: string;
  timestamp: number;
  svgContent: string;
  totalArea: number;
  roomCount: number;
  rooms: Room[];
  dqiScore: number;
  qualityClass: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  suggestions: Suggestion[];
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppSettings {
  demoMode: boolean;
  apiBaseUrl: string;
  theme: 'light' | 'dark';
}
