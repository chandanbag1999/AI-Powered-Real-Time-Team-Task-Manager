import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/utils/apiClient";
import type { Project } from "@/types";
import { toast } from "sonner";

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  deletingIds: string[];
}

const initialState: ProjectsState = {
  projects: [],
  loading: false,
  error: null,
  deletingIds: []
};

// Helper to normalize project IDs (handle MongoDB _id)
const normalizeProject = (project: any): Project => {
  if (!project) return project;
  return {
    ...project,
    id: project.id || project._id
  };
};

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, thunkAPI) => {
    try {
      console.log("Making API request to fetch projects");
      const response = await apiClient.get("/projects");
      console.log("Projects API response:", response.data);
      
      // The backend might not use the ApiResponse wrapper
      // Check the structure of the response and handle accordingly
      let projects = [];
      if (Array.isArray(response.data)) {
        projects = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        projects = response.data.data;
      } else {
        console.error("Unexpected API response format:", response.data);
        return [];
      }
      
      // Normalize projects to ensure they have id property
      return projects.map(normalizeProject);
    } catch (error: any) {
      console.error("Project fetch error:", error.response?.data || error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch projects"
      );
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData: { name: string; description: string }, thunkAPI) => {
    try {
      const response = await apiClient.post("/projects", projectData);
      return normalizeProject(response.data);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create project"
      );
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id: string, thunkAPI) => {
    try {
      await apiClient.delete(`/projects/${id}`);
      return id;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to delete project"
      );
    }
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        console.log("Projects loaded:", state.projects.length);
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(state.error || "Failed to load projects");
        console.error("Projects fetch rejected:", action.payload);
      })
      
      // Create project
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
        toast.success("Project created successfully");
      })
      .addCase(createProject.rejected, (_state, action) => {
        toast.error(action.payload as string || "Failed to create project");
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state, action) => {
        state.deletingIds.push(action.meta.arg);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(project => 
          (project.id !== action.payload && project._id !== action.payload)
        );
        state.deletingIds = state.deletingIds.filter(id => id !== action.payload);
        toast.success("Project deleted successfully");
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.deletingIds = state.deletingIds.filter(id => id !== action.meta.arg);
        toast.error(action.payload as string || "Failed to delete project");
      });
  },
});

export default projectsSlice.reducer; 