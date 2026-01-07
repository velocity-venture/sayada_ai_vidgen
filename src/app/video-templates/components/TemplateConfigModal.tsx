'use client';

import React, { useState, useEffect } from 'react';
import { videoTemplateService } from '@/services/videoTemplateService';
import type { VideoTemplate, UpdateVideoTemplateInput } from '@/types/models';

interface TemplateConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: VideoTemplate;
  onSuccess: (updatedTemplate: VideoTemplate) => void;
}

export function TemplateConfigModal({
  isOpen,
  onClose,
  template,
  onSuccess,
}: TemplateConfigModalProps) {
  const [formData, setFormData] = useState<UpdateVideoTemplateInput>({
    elevenLabsVoiceId: template.elevenLabsVoiceId || '',
    pikaStylePrompt: template.pikaStylePrompt || '',
    pikaNegativePrompt: template.pikaNegativePrompt || '',
    motionStrength: template.motionStrength || 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        elevenLabsVoiceId: template.elevenLabsVoiceId || '',
        pikaStylePrompt: template.pikaStylePrompt || '',
        pikaNegativePrompt: template.pikaNegativePrompt || '',
        motionStrength: template.motionStrength || 2,
      });
      setError(null);
    }
  }, [isOpen, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const updatedTemplate = await videoTemplateService.updateTemplate(
        template.id,
        formData
      );

      onSuccess(updatedTemplate);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Advanced AI Configuration</h2>
              <p className="text-slate-400 mt-1">
                Configure ElevenLabs voice and Pika Labs parameters for "{template.name}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Voice Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🎤</span>
                ElevenLabs Voice Configuration
              </h3>
              
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Voice ID
              </label>
              <input
                type="text"
                value={formData.elevenLabsVoiceId || ''}
                onChange={(e) => setFormData({ ...formData, elevenLabsVoiceId: e.target.value })}
                placeholder="e.g., deep_male_narrator, energetic_female_announcer"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <p className="text-sm text-slate-400 mt-2">
                Paste your ElevenLabs Voice ID from your voice library. Leave empty to use default.
              </p>
            </div>
          </div>

          {/* Pika Labs Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              Pika Labs Visual Configuration
            </h3>

            {/* Style Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Style Prompt (What to Include)
              </label>
              <textarea
                value={formData.pikaStylePrompt || ''}
                onChange={(e) => setFormData({ ...formData, pikaStylePrompt: e.target.value })}
                placeholder="e.g., Cinematic lighting, 8k, photorealistic, slow motion, golden hour..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-sm text-slate-400 mt-2">
                Describe the visual style, lighting, camera movement, and quality settings.
              </p>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Negative Prompt (What to Avoid)
              </label>
              <textarea
                value={formData.pikaNegativePrompt || ''}
                onChange={(e) => setFormData({ ...formData, pikaNegativePrompt: e.target.value })}
                placeholder="e.g., cartoon, blurry, distorted, low quality..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-sm text-slate-400 mt-2">
                List visual elements to avoid (e.g., cartoon, anime, blurry, distorted).
              </p>
            </div>

            {/* Motion Strength */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Motion Strength: {formData.motionStrength || 2} ({
                  formData.motionStrength === 1 ? 'Low' :
                  formData.motionStrength === 2 ? 'Medium' :
                  formData.motionStrength === 3 ? 'High' : 'Very High'
                })
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={formData.motionStrength || 2}
                onChange={(e) => setFormData({ ...formData, motionStrength: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 - Low Motion</span>
                <span>2 - Medium</span>
                <span>3 - High</span>
                <span>4 - Very High</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Controls how much motion and camera movement Pika Labs will generate (1=Subtle, 4=Dynamic).
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Configuration Preview</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div>
                <span className="font-medium">Voice:</span>{' '}
                {formData.elevenLabsVoiceId || 'Default'}
              </div>
              <div>
                <span className="font-medium">Motion:</span>{' '}
                {formData.motionStrength === 1 ? 'Low (Subtle camera movement)' :
                 formData.motionStrength === 2 ? 'Medium (Balanced movement)' :
                 formData.motionStrength === 3 ? 'High (Dynamic camera work)': 'Very High (Fast, energetic movement)'}
              </div>
              {formData.pikaStylePrompt && (
                <div>
                  <span className="font-medium">Style:</span> {formData.pikaStylePrompt.substring(0, 100)}
                  {formData.pikaStylePrompt.length > 100 && '...'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}