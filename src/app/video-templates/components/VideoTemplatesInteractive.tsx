'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { videoTemplateService } from '@/services/videoTemplateService';
import { TemplateCard } from './TemplateCard';
import { CreateTemplateModal } from './CreateTemplateModal';
import { TemplateConfigModal } from './TemplateConfigModal';
import type { VideoTemplate, TemplateCategory } from '@/types/models';

const CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'devotional', label: 'Devotional', icon: '📖' },
  { value: 'testimony', label: 'Testimony', icon: '💬' },
  { value: 'prayer', label: 'Prayer', icon: '🙏' },
  { value: 'worship', label: 'Worship', icon: '🎵' },
  { value: 'teaching', label: 'Teaching', icon: '🎓' },
  { value: 'evangelism', label: 'Evangelism', icon: '✝️' },
];

const categoryLabels: Record<TemplateCategory, string> = {
  cinematic_story: 'Cinematic Story',
  high_energy_promo: 'High Energy Promo',
  modern_minimalist: 'Modern Minimalist',
};

const categoryDescriptions: Record<TemplateCategory, string> = {
  cinematic_story: 'Emotional storytelling with slow pacing and orchestral music',
  high_energy_promo: 'Fast-paced promotional content with upbeat electronic music',
  modern_minimalist: 'Clean, professional aesthetic with ambient audio',
};

export function VideoTemplatesInteractive() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<VideoTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showMyTemplates, setShowMyTemplates] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [configTemplate, setConfigTemplate] = useState<VideoTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, showMyTemplates, user]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoTemplateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by user's templates
    if (showMyTemplates && user) {
      filtered = filtered.filter(t => t.createdBy === user.id);
    }

    setFilteredTemplates(filtered);
  };

  const handleConfigureTemplate = (template: VideoTemplate) => {
    setConfigTemplate(template);
  };

  const handleConfigSuccess = (updatedTemplate: VideoTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setConfigTemplate(null);
  };

  const handleUseTemplate = async (template: VideoTemplate) => {
    try {
      // Apply template and navigate to video creation with pre-filled settings
      const settings = await videoTemplateService.applyTemplateToProject(template.id);
      
      // Navigate to video creation page with template settings as URL params
      const params = new URLSearchParams({
        templateId: template.id,
        stylePreset: settings.stylePreset,
        duration: settings.durationSeconds.toString(),
        ...(settings.voiceId && { voiceId: settings.voiceId }),
      });
      
      router.push(`/video-creation?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await videoTemplateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleCreateTemplate = async (template: VideoTemplate) => {
    setTemplates(prev => [template, ...prev]);
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Video Templates</h1>
              <p className="text-slate-400 mt-1">
                Choose from pre-configured templates for common scripture types
              </p>
            </div>
            {user && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                + Create Template
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all' ?'bg-blue-600 text-white' :'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.value
                      ? 'bg-blue-600 text-white' :'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* My Templates Toggle */}
          {user && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="myTemplates"
                checked={showMyTemplates}
                onChange={e => setShowMyTemplates(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="myTemplates" className="text-slate-300 cursor-pointer">
                Show only my templates
              </label>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">
              {showMyTemplates
                ? 'You have not created any templates yet.' :'No templates found for this category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                onConfigure={user ? handleConfigureTemplate : undefined}
                onDelete={
                  user && template.createdBy === user.id
                    ? handleDeleteTemplate
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && user && (
        <CreateTemplateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateTemplate}
          userId={user.id}
        />
      )}

      {/* Configure Template Modal */}
      {configTemplate && (
        <TemplateConfigModal
          isOpen={!!configTemplate}
          onClose={() => setConfigTemplate(null)}
          template={configTemplate}
          onSuccess={handleConfigSuccess}
        />
      )}
    </div>
  );
}