export interface User {
  id?: string;
  _id?: string; // Backend might return _id instead of id
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id?: string;
  _id?: string; // Backend might return _id instead of id
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  members: string[];
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  project: string;
  createdBy: string;
  fileUrl?: string;
  subtasks?: string[];
  fileName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
} 