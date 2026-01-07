'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface BrandAssetsTabProps {
  onChangeDetected: () => void;
}

const BrandAssetsTab = ({ onChangeDetected }: BrandAssetsTabProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [introVideoFile, setIntroVideoFile] = useState<string | null>(null);
  const [outroVideoFile, setOutroVideoFile] = useState<string | null>(null);
  const [ctaText, setCtaText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    // Load saved assets from localStorage
    const savedLogo = localStorage.getItem('brandLogo');
    const savedIntro = localStorage.getItem('brandIntroVideo');
    const savedOutro = localStorage.getItem('brandOutroVideo');
    const savedCta = localStorage.getItem('brandCtaText');
    
    if (savedLogo) setLogoFile(savedLogo);
    if (savedIntro) setIntroVideoFile(savedIntro);
    if (savedOutro) setOutroVideoFile(savedOutro);
    if (savedCta) setCtaText(savedCta);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHydrated) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(reader.result as string);
        onChangeDetected();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIntroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHydrated) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIntroVideoFile(reader.result as string);
        onChangeDetected();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHydrated) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOutroVideoFile(reader.result as string);
        onChangeDetected();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCtaChange = (value: string) => {
    if (!isHydrated) return;
    setCtaText(value);
    onChangeDetected();
  };

  const handleSave = async () => {
    if (!isHydrated) return;
    setIsSaving(true);
    
    // Save to localStorage
    if (logoFile) localStorage.setItem('brandLogo', logoFile);
    if (introVideoFile) localStorage.setItem('brandIntroVideo', introVideoFile);
    if (outroVideoFile) localStorage.setItem('brandOutroVideo', outroVideoFile);
    localStorage.setItem('brandCtaText', ctaText);
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const removeAsset = (type: 'logo' | 'intro' | 'outro') => {
    if (!isHydrated) return;
    switch (type) {
      case 'logo':
        setLogoFile(null);
        localStorage.removeItem('brandLogo');
        break;
      case 'intro':
        setIntroVideoFile(null);
        localStorage.removeItem('brandIntroVideo');
        break;
      case 'outro':
        setOutroVideoFile(null);
        localStorage.removeItem('brandOutroVideo');
        break;
    }
    onChangeDetected();
  };

  if (!isHydrated) {
    return (
      <div className="p-8">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Logo Upload */}
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Brand Logo
          </h3>
          <p className="font-caption text-sm text-muted-foreground">
            Upload your logo for video watermarking (PNG or SVG recommended)
          </p>
        </div>

        <div className="flex items-start gap-4">
          {logoFile ? (
            <div className="relative group">
              <div className="w-32 h-32 rounded-lg border-2 border-border bg-background overflow-hidden">
                <AppImage
                  src={logoFile}
                  alt="Brand logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={() => removeAsset('logo')}
                className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                title="Remove logo"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
            </div>
          ) : (
            <label className="w-32 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-all duration-250 cursor-pointer flex flex-col items-center justify-center gap-2 focus-within:ring-2 focus-within:ring-primary">
              <Icon name="PhotoIcon" size={32} className="text-muted-foreground" />
              <span className="font-caption text-xs text-muted-foreground">Upload Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Intro Video Upload */}
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Intro Video
          </h3>
          <p className="font-caption text-sm text-muted-foreground">
            Optional intro sequence to play before your generated content
          </p>
        </div>

        <div className="flex items-start gap-4">
          {introVideoFile ? (
            <div className="relative group">
              <div className="w-48 h-32 rounded-lg border-2 border-border bg-background overflow-hidden flex items-center justify-center">
                <Icon name="FilmIcon" size={48} className="text-primary" />
              </div>
              <button
                onClick={() => removeAsset('intro')}
                className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                title="Remove intro video"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
              <p className="font-caption text-xs text-muted-foreground mt-2">Intro video uploaded</p>
            </div>
          ) : (
            <label className="w-48 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-all duration-250 cursor-pointer flex flex-col items-center justify-center gap-2 focus-within:ring-2 focus-within:ring-primary">
              <Icon name="FilmIcon" size={32} className="text-muted-foreground" />
              <span className="font-caption text-xs text-muted-foreground">Upload Intro</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleIntroVideoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Outro Video Upload */}
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Outro Video
          </h3>
          <p className="font-caption text-sm text-muted-foreground">
            Optional outro sequence to play after your generated content
          </p>
        </div>

        <div className="flex items-start gap-4">
          {outroVideoFile ? (
            <div className="relative group">
              <div className="w-48 h-32 rounded-lg border-2 border-border bg-background overflow-hidden flex items-center justify-center">
                <Icon name="FilmIcon" size={48} className="text-primary" />
              </div>
              <button
                onClick={() => removeAsset('outro')}
                className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                title="Remove outro video"
              >
                <Icon name="XMarkIcon" size={16} />
              </button>
              <p className="font-caption text-xs text-muted-foreground mt-2">Outro video uploaded</p>
            </div>
          ) : (
            <label className="w-48 h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-all duration-250 cursor-pointer flex flex-col items-center justify-center gap-2 focus-within:ring-2 focus-within:ring-primary">
              <Icon name="FilmIcon" size={32} className="text-muted-foreground" />
              <span className="font-caption text-xs text-muted-foreground">Upload Outro</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleOutroVideoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Call to Action Text */}
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
            Default Call to Action
          </h3>
          <p className="font-caption text-sm text-muted-foreground">
            Text displayed at the end of videos to encourage viewer engagement
          </p>
        </div>

        <textarea
          value={ctaText}
          onChange={(e) => handleCtaChange(e.target.value)}
          placeholder="e.g., Join the VR Experience, Visit WalkWithHim.ai, Subscribe for More"
          rows={3}
          maxLength={200}
          className="w-full px-4 py-3 bg-background border border-border rounded-md font-caption text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-250 resize-none"
        />
        <div className="flex justify-between items-center">
          <p className="font-caption text-xs text-muted-foreground">
            {ctaText.length}/200 characters
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-border flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-caption text-sm font-semibold hover:bg-primary/90 transition-all duration-250 focus-ring shadow-glow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Icon name={isSaving ? 'ArrowPathIcon' : 'CheckIcon'} size={18} className={isSaving ? 'animate-spin' : ''} />
          {isSaving ? 'Saving...' : 'Save Brand Assets'}
        </button>
      </div>
    </div>
  );
};

export default BrandAssetsTab;