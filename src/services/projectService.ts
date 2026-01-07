import { supabase } from '@/lib/supabase/client';
import { Project, ProjectInsert, ProjectUpdate, ProjectStats } from '@/types/models';
import { Database } from '@/types/database.types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type ProjectInsertRow = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdateRow = Database['public']['Tables']['projects']['Update'];

// Conversion utilities - snake_case to camelCase
function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    scriptContent: row.script_content,
    status: row.status,
    videoUrl: row.video_url ?? undefined,
    durationSeconds: row.duration_seconds,
    stylePreset: row.style_preset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Conversion utilities - camelCase to snake_case
function projectInsertToRow(project: ProjectInsert): ProjectInsertRow {
  return {
    user_id: project.userId,
    title: project.title,
    script_content: project.scriptContent,
    status: project.status,
    duration_seconds: project.durationSeconds,
    style_preset: project.stylePreset,
  };
}

function projectUpdateToRow(updates: ProjectUpdate): ProjectUpdateRow {
  return {
    title: updates.title,
    script_content: updates.scriptContent,
    status: updates.status,
    video_url: updates.videoUrl,
    duration_seconds: updates.durationSeconds,
    style_preset: updates.stylePreset,
  };
}

export const projectService = {
  /**
   * Get all projects for the authenticated user
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(rowToProject);
  },

  /**
   * Get a single project by ID
   */
  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }

    return data ? rowToProject(data) : null;
  },

  /**
   * Create a new project
   */
  async createProject(project: ProjectInsert): Promise<Project> {
    const insertData = projectInsertToRow(project);

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToProject(data);
  },

  /**
   * Update an existing project
   */
  async updateProject(
    projectId: string,
    updates: ProjectUpdate,
    userId: string
  ): Promise<Project> {
    const updateData = projectUpdateToRow(updates);

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToProject(data);
  },

  /**
   * Delete a project
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  /**
   * Get project statistics for the user
   */
  async getProjectStats(userId: string): Promise<ProjectStats> {
    const { data, error } = await supabase
      .from('projects')
      .select('status, duration_seconds')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const projects = data || [];
    const totalVideos = projects.filter(p => p.status === 'completed').length;
    const activeProjects = projects.filter(p => p.status === 'processing').length;
    const totalMinutes = projects.reduce((sum, p) => sum + (p.duration_seconds / 60), 0);

    return {
      totalVideos,
      activeProjects,
      totalMinutes: Math.round(totalMinutes * 10) / 10,
      avgQuality: 8.9, // This would come from a separate quality tracking system
    };
  },

  /**
   * Filter projects by status
   */
  async getProjectsByStatus(
    userId: string,
    status: 'draft' | 'processing' | 'completed' | 'failed'
  ): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(rowToProject);
  },
};