import apiClient from "./apiClient";
import type { Task } from "../types";


const taskService = {
  
  getTasks: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    return Array.isArray(response.data) ? response.data : (response.data.tasks || []);
  },

  
  getTask: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get(`/tasks/task/${taskId}`);
    return response.data;
  },

  
  createTask: async (
    projectId: string, 
    taskData: Partial<Task>, 
    file?: File
  ): Promise<Task> => {
    // Add project ID to task data
    const taskWithProject = { ...taskData, project: projectId };
    
    // If there's a file, use FormData
    if (file) {
      const formData = new FormData();
      
      // Add task data
      Object.entries(taskWithProject).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file
      formData.append('file', file);
      
      const response = await apiClient.post(`/tasks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } 
    
    // No file, regular JSON request
    const response = await apiClient.post(`/tasks`, taskWithProject);
    return response.data;
  },

 // Update a task
  updateTask: async (
    taskId: string,
    taskData: Partial<Task>,
    file?: File
  ): Promise<Task> => {
    // If there's a file, use FormData
    if (file) {
      const formData = new FormData();
      
      // Add task data
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Add file
      formData.append('file', file);
      
      const response = await apiClient.put(`/tasks/task/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    }
    
    // No file, regular JSON request
    const response = await apiClient.put(`/tasks/task/${taskId}`, taskData);
    return response.data;
  },

  
  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/task/${taskId}`);
  },

  
  deleteTaskFile: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/task/${taskId}/file`);
  },

 
  updateTaskStatus: async (
    taskId: string,
    status: "todo" | "in-progress" | "completed"
  ): Promise<Task> => {
    console.log(`API: Updating task ${taskId} status to ${status}`);
    
    try {
      // Use the same endpoint as updateTask but with PUT method
      const response = await apiClient.put(`/tasks/task/${taskId}`, { status });
      console.log("API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("API error updating task status:", error);
      throw error;
    }
  },
};

export default taskService; 