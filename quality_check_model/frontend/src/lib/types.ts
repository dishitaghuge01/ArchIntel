export interface Room {
  name: string;
  area: number;
}

export interface Suggestion {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  title?: string; // For backend suggestions with issue field
  metric?: string; // For backend suggestions with metric field
  value?: number; // For backend suggestions with value field
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
  qualityClass: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Average'; // Include 'Average'
  suggestions: Suggestion[];
  chatHistory: ChatMessage[];
  sessionId?: string; // Backend session ID
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
