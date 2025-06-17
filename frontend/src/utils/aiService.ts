import apiClient from "./apiClient";

export interface AiSuggestSubtasksResponse {
  subtasks: string[];
}

export interface AiParseReminderResponse {
  dueDate: string;
}

export interface AiExtractTasksResponse {
  tasks: string[];
}

export interface AiSearchQueryResponse {
  filter: Record<string, any>;
}

export interface AiPriorityResponse {
  priority: "low" | "medium" | "high";
}

// interact with the backend AI endpointse to 
const aiService = {
  
  suggestSubtasks: async (title: string): Promise<string[]> => {
    const response = await apiClient.post<AiSuggestSubtasksResponse>("/ai/suggest-subtasks", { title });
    return response.data.subtasks;
  },

  
  parseReminder: async (reminder: string): Promise<string> => {
    const response = await apiClient.post<AiParseReminderResponse>("/ai/parse-reminder", { reminder });
    return response.data.dueDate;
  },

  
  extractTasksFromNote: async (note: string): Promise<string[]> => {
    const response = await apiClient.post<AiExtractTasksResponse>("/ai/notes-to-tasks", { note });
    return response.data.tasks;
  },

  
  parseSearchQuery: async (query: string): Promise<Record<string, any>> => {
    const response = await apiClient.post<AiSearchQueryResponse>("/ai/search-query", { query });
    return response.data.filter;
  },

  
  autoPrioritizeTask: async (taskId: string): Promise<"low" | "medium" | "high"> => {
    try {
      const response = await apiClient.post<AiPriorityResponse>("/ai/auto-prioritize", { taskId });
      return response.data.priority;
    } catch (error: any) {
      // Add more context to the error
      if (error.response?.status === 500) {
        console.error("Server error during auto-prioritize:", error.response?.data);
        throw new Error(error.response?.data?.message || "Server error during auto-prioritize");
      }
      
      // Rethrow with better context
      throw error;
    }
  },
};

export default aiService; 