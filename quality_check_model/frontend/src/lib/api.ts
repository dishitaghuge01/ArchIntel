import { z } from 'zod';

// API Response wrapper schema
const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  error: z.string().nullable(), // Make it nullable instead of optional
});

// Backend raw response schema (matches actual API response)
const RawAnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    session_id: z.string(),
    summary: z.object({
      num_rooms: z.number(),
      total_area: z.number(),
      dqi_score: z.number(),
      quality_class: z.string(), // Accept any string from backend
      issues_detected: z.number(), // Backend returns number, not array
    }),
    suggestions: z.array(z.object({
      issue: z.string(),
      metric: z.string().optional(),
      value: z.number().optional(),
      recommendation: z.string(),
    })),
    parsed: z.any(), // Add parsed data
  }),
  error: z.null().optional(),
});

// Transformed response schema (matches UI expectations)
const AnalysisResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    session_id: z.string(),
    summary: z.object({
      num_rooms: z.number(),
      total_area: z.number(),
      dqi_score: z.number(),
      quality_class: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Average']), // Include "Average"
      issues_detected: z.number(), // Keep as number
    }),
    suggestions: z.array(z.object({
      severity: z.enum(['critical', 'warning', 'info']).default('warning'), // Default severity
      message: z.string(), // Use recommendation as message
      title: z.string(), // Use issue as title
      metric: z.string().optional(), // Include metric if available
      value: z.number().optional(), // Include value if available
    })),
    parsed: z.any(), // Add parsed data
  }),
  error: z.null().optional(),
});

// Chat response schema
const ChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    answer: z.string(),
  }),
  error: z.null().optional(),
});

// Types
export type ApiResponse<T = any> = {
  success: boolean;
  data: T;
  error: null | string;
};

export type RawAnalysisResponse = z.infer<typeof RawAnalysisResponseSchema>;
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export interface ApiClientConfig {
  baseUrl: string;
  authToken?: string;
}

class ApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = config.authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from server: ${text}`);
      }

      const validated = ApiResponseSchema.parse(data);
      console.log('API request validated response:', validated);
      
      if (!validated.success && validated.error) {
        console.log('API request failed:', validated.error);
        throw new Error(validated.error);
      }

      console.log('API request successful, returning:', {
        success: validated.success,
        data: validated.data,
        error: validated.error,
      });
      
      return {
        success: validated.success,
        data: validated.data,
        error: validated.error,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred during API request');
    }
  }

  async healthCheck(): Promise<ApiResponse<null>> {
    return this.request('/health');
  }

  async analyzeSvg(file: File): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/analyze/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser handle multipart boundary
      headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const rawData = await response.json();
    console.log('Raw backend response:', rawData);
    
    // Validate raw response from backend
    const validatedRaw = RawAnalysisResponseSchema.parse(rawData);
    console.log('Validated raw response:', validatedRaw);
    
    if (!validatedRaw.success || !validatedRaw.data) {
      throw new Error(validatedRaw.error || 'Analysis failed');
    }

    // Transform raw backend response to UI-expected format
    const transformedData = {
      success: true,
      data: {
        session_id: validatedRaw.data.session_id,
        summary: {
          num_rooms: validatedRaw.data.summary.num_rooms,
          total_area: validatedRaw.data.summary.total_area,
          dqi_score: validatedRaw.data.summary.dqi_score,
          quality_class: this.normalizeQualityClass(validatedRaw.data.summary.quality_class),
          issues_detected: validatedRaw.data.summary.issues_detected,
        },
        suggestions: validatedRaw.data.suggestions.map(suggestion => ({
          severity: this.getDefaultSeverity(suggestion.issue),
          title: suggestion.issue,
          message: suggestion.recommendation,
          metric: suggestion.metric, // Include metric if available
          value: suggestion.value, // Include value if available
        })),
      },
      error: null,
    };

    console.log('Transformed data for UI:', transformedData);
    return AnalysisResponseSchema.parse(transformedData);
  }

  normalizeQualityClass(backendQuality: string): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Average' {
    // Normalize backend quality class to match UI expectations
    const normalized = backendQuality.toLowerCase();
    if (normalized.includes('excellent')) return 'Excellent';
    if (normalized.includes('good')) return 'Good';
    if (normalized.includes('fair')) return 'Fair';
    if (normalized.includes('poor')) return 'Poor';
    if (normalized.includes('average')) return 'Average';
    
    // Default fallback
    return 'Average';
  }

  getDefaultSeverity(issue: string): 'critical' | 'warning' | 'info' {
    const normalized = issue.toLowerCase();
    if (normalized.includes('critical') || normalized.includes('danger') || normalized.includes('severe')) {
      return 'critical';
    }
    if (normalized.includes('warning') || normalized.includes('caution') || normalized.includes('improve')) {
      return 'warning';
    }
    return 'info';
  }

  async askQuestion(sessionId: string, question: string): Promise<ChatResponse> {
    console.log('=== API CLIENT ASK QUESTION DEBUG ===');
    console.log('askQuestion called with:', { sessionId, question });
    
    const response = await this.request('/ask/', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        question,
      }),
    });

    console.log('Raw response from /ask/:', response);

    // Validate and transform chat response
    const validated = ChatResponseSchema.parse(response);
    console.log('Chat response validated:', validated);
    
    return validated;
  }

  async resetSession(): Promise<ApiResponse<null>> {
    return this.request('/reset/', {
      method: 'POST',
    });
  }
}

// Create singleton instance
let apiClient: ApiClient | null = null;

export function createApiClient(config?: ApiClientConfig): ApiClient {
  const defaultConfig: ApiClientConfig = {
    baseUrl: typeof window !== 'undefined' 
      ? window.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      : 'http://localhost:8000',
  };

  const finalConfig = { ...defaultConfig, ...config };
  apiClient = new ApiClient(finalConfig);
  return apiClient;
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    return createApiClient();
  }
  return apiClient;
}

export function isApiClientConfigured(): boolean {
  return apiClient !== null;
}

// Export a test function to verify transformation
export function testTransformation() {
  // Simulate a real backend response
  const mockRawResponse = {
    success: true,
    data: {
      session_id: "test-session-123",
      summary: {
        num_rooms: 4,
        total_area: 125.5,
        dqi_score: 72,
        quality_class: "Average",
        issues_detected: 3
      },
      suggestions: [
        {
          issue: "Low space efficiency",
          metric: "efficiency",
          value: 0.65,
          recommendation: "Reduce circulation space to improve efficiency"
        },
        {
          issue: "Poor natural lighting",
          recommendation: "Add more windows or skylights in living areas"
        }
      ]
    }
  };

  console.log('=== TESTING TRANSFORMATION ===');
  console.log('Mock raw response:', mockRawResponse);
  
  // Test validation
  const validated = RawAnalysisResponseSchema.parse(mockRawResponse);
  console.log('Validated raw response:', validated);
  
  // Test transformation
  const apiClient = new ApiClient({ baseUrl: 'http://localhost:8000' });
  const transformed = {
    success: true,
    data: {
      session_id: validated.data.session_id,
      summary: {
        num_rooms: validated.data.summary.num_rooms,
        total_area: validated.data.summary.total_area,
        dqi_score: validated.data.summary.dqi_score,
        quality_class: apiClient.normalizeQualityClass(validated.data.summary.quality_class),
        issues_detected: validated.data.summary.issues_detected,
      },
      suggestions: validated.data.suggestions.map(suggestion => ({
        severity: apiClient.getDefaultSeverity(suggestion.issue),
        title: suggestion.issue,
        message: suggestion.recommendation,
      })),
    },
    error: null,
  };
  
  console.log('Transformed response:', transformed);
  
  // Test final validation
  const finalValidated = AnalysisResponseSchema.parse(transformed);
  console.log('Final validated response:', finalValidated);
  console.log('=== TRANSFORMATION TEST COMPLETE ===');
  
  return finalValidated;
}

// Export types for use in components
export type { ApiClient };
