import { supabase } from '@/lib/supabase/client';
import type {
  VideoTemplate,
  CreateVideoTemplateInput,
  UpdateVideoTemplateInput,
  TemplateCategory,
} from '@/types/models';

// Helper function to convert snake_case to camelCase
function toCamelCase<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as T;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any) as T;
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
}

class VideoTemplateService {
  /**
   * Get all available templates (system templates + user's custom templates)
   */
  async getTemplates(): Promise<VideoTemplate[]> {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return toCamelCase<VideoTemplate[]>(data || []);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: TemplateCategory): Promise<VideoTemplate[]> {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error) {
      console.error(`Error fetching templates for category ${category}:`, error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return toCamelCase<VideoTemplate[]>(data || []);
  }

  /**
   * Get only system templates
   */
  async getSystemTemplates(): Promise<VideoTemplate[]> {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('is_system_template', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching system templates:', error);
      throw new Error(`Failed to fetch system templates: ${error.message}`);
    }

    return toCamelCase<VideoTemplate[]>(data || []);
  }

  /**
   * Get user's custom templates
   */
  async getUserTemplates(userId: string): Promise<VideoTemplate[]> {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('created_by', userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching user templates:', error);
      throw new Error(`Failed to fetch user templates: ${error.message}`);
    }

    return toCamelCase<VideoTemplate[]>(data || []);
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string): Promise<VideoTemplate | null> {
    const { data, error } = await supabase
      .from('video_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching template:', error);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }

    return toCamelCase<VideoTemplate>(data);
  }

  /**
   * Create a new custom template
   */
  async createTemplate(input: CreateVideoTemplateInput, userId: string): Promise<VideoTemplate> {
    const templateData = toSnakeCase({
      ...input,
      createdBy: userId,
      isSystemTemplate: false,
    });

    const { data, error } = await supabase
      .from('video_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return toCamelCase<VideoTemplate>(data);
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    id: string,
    updates: UpdateVideoTemplateInput
  ): Promise<VideoTemplate> {
    const updateData = toSnakeCase(updates);

    const { data, error } = await supabase
      .from('video_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error.message}`);
    }

    return toCamelCase<VideoTemplate>(data);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('video_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsageCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: id,
    });

    if (error) {
      // Fallback if RPC doesn't exist - direct update
      const { data: template } = await supabase
        .from('video_templates')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (template) {
        await supabase
          .from('video_templates')
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq('id', id);
      }
    }
  }

  /**
   * Apply template to a project (returns template settings including AI configuration)
   */
  async applyTemplateToProject(templateId: string): Promise<{
    stylePreset: string;
    durationSeconds: number;
    voiceId: string | null;
    elevenLabsVoiceId: string | null;
    pikaStylePrompt: string | null;
    pikaNegativePrompt: string | null;
    motionStrength: number;
  }> {
    const template = await this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    await this.incrementUsageCount(templateId);

    return {
      stylePreset: template.stylePreset,
      durationSeconds: template.durationSeconds,
      voiceId: template.voiceId || null,
      elevenLabsVoiceId: template.elevenLabsVoiceId || null,
      pikaStylePrompt: template.pikaStylePrompt || null,
      pikaNegativePrompt: template.pikaNegativePrompt || null,
      motionStrength: template.motionStrength || 2,
    };
  }

  /**
   * Get template AI configuration for AI Director
   */
  async getTemplateAIConfig(templateId: string): Promise<{
    elevenLabsVoiceId: string | null;
    pikaStylePrompt: string | null;
    pikaNegativePrompt: string | null;
    motionStrength: number;
  } | null> {
    const template = await this.getTemplateById(templateId);
    
    if (!template) {
      return null;
    }

    return {
      elevenLabsVoiceId: template.elevenLabsVoiceId || null,
      pikaStylePrompt: template.pikaStylePrompt || null,
      pikaNegativePrompt: template.pikaNegativePrompt || null,
      motionStrength: template.motionStrength || 2,
    };
  }
}

export const videoTemplateService = new VideoTemplateService();