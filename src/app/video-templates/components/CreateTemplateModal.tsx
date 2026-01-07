'use client';

import React, { useState } from 'react';
import { videoTemplateService } from '@/services/videoTemplateService';
import type { VideoTemplate, TemplateCategory, CreateVideoTemplateInput } from '@/types/models';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (template: VideoTemplate) => void;
  userId: string;
}

export function CreateTemplateModal({ isOpen, onClose, onCreated, userId }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('cinematic_story');
  const [stylePreset, setStylePreset] = useState('Photorealistic Cinematic');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [voiceId, setVoiceId] = useState('');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState('');
  const [pikaStylePrompt, setPikaStylePrompt] = useState('Cinematic lighting, 8k, photorealistic');
  const [pikaNegativePrompt, setPikaNegativePrompt] = useState('cartoon, blurry, distorted');
  const [motionStrength, setMotionStrength] = useState<number>(2);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input: CreateVideoTemplateInput = {
        name,
        description: description || undefined,
        category,
        stylePreset,
        duration_seconds: durationSeconds,
        voice_id: voiceId || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        // AI Configuration
        elevenlabs_voice_id: elevenLabsVoiceId || undefined,
        pika_style_prompt: pikaStylePrompt || undefined,
        pika_negative_prompt: pikaNegativePrompt || undefined,
        motion_strength: motionStrength || undefined,
      };

      const newTemplate = await videoTemplateService.createTemplate(input, userId);
      onCreated(newTemplate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Create Template</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="My Custom Template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your template..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cinematic_story">Cinematic Story</option>
                  <option value="high_energy_promo">High Energy Promo</option>
                  <option value="modern_minimalist">Modern Minimalist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                  required
                  min={10}
                  max={300}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* AI Configuration Section */}
            <div className="border-t border-slate-700 pt-4 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🎨</span> AI Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="mr-2">🎤</span> ElevenLabs Voice ID
                </label>
                <input
                  type="text"
                  value={elevenLabsVoiceId}
                  onChange={(e) => setElevenLabsVoiceId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="rachel, bella, adam, etc."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Paste your specific ElevenLabs Voice ID here
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-4">
                  <span className="mr-2">✨</span> Pika Style Prompt
                </label>
                <textarea
                  value={pikaStylePrompt}
                  onChange={(e) => setPikaStylePrompt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Cinematic lighting, 8k, photorealistic"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Base visual style for Pika Labs generation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-4">
                  <span className="mr-2">🚫</span> Pika Negative Prompt
                </label>
                <textarea
                  value={pikaNegativePrompt}
                  onChange={(e) => setPikaNegativePrompt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="cartoon, blurry, distorted"
                />
                <p className="text-xs text-slate-400 mt-1">
                  What to avoid in Pika generation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-4">
                  <span className="mr-2">🎬</span> Motion Strength (1-4)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={motionStrength}
                    onChange={(e) => setMotionStrength(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white font-bold text-lg w-12 text-center">
                    {motionStrength}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Very High</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}