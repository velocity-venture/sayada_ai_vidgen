'use client';




interface AdvancedSettingsState {
  audioSpeed: number;
  transitionStyle: string;
  sceneTransitionDuration: number;
  backgroundMusic: boolean;
  subtitles: boolean;
}

interface AdvancedSettingsProps {
  settings: AdvancedSettingsState;
  onSettingsChange: (settings: AdvancedSettingsState) => void;
}

export default function AdvancedSettings({ settings, onSettingsChange }: AdvancedSettingsProps) {
  const handleChange = (key: keyof AdvancedSettingsState, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-glow-soft">
      <h3 className="font-caption text-lg font-semibold text-foreground mb-4">
        Advanced Settings
      </h3>

      <div className="space-y-6">
        {/* Audio Speed */}
        <div>
          <label className="block font-caption text-sm font-medium text-foreground mb-2">
            Audio Speed: {settings.audioSpeed.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.audioSpeed}
            onChange={(e) => handleChange('audioSpeed', parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between font-caption text-xs text-muted-foreground mt-1">
            <span>0.5x</span>
            <span>1.0x</span>
            <span>2.0x</span>
          </div>
        </div>

        {/* Transition Style */}
        <div>
          <label className="block font-caption text-sm font-medium text-foreground mb-2">
            Transition Style
          </label>
          <select
            value={settings.transitionStyle}
            onChange={(e) => handleChange('transitionStyle', e.target.value)}
            className="w-full px-4 py-2 bg-background border border-border rounded-md font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-250"
          >
            <option value="fade">Fade</option>
            <option value="dissolve">Dissolve</option>
            <option value="wipe">Wipe</option>
            <option value="slide">Slide</option>
          </select>
        </div>

        {/* Scene Transition Duration */}
        <div>
          <label className="block font-caption text-sm font-medium text-foreground mb-2">
            Scene Transition Duration: {settings.sceneTransitionDuration.toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={settings.sceneTransitionDuration}
            onChange={(e) => handleChange('sceneTransitionDuration', parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between font-caption text-xs text-muted-foreground mt-1">
            <span>0.5s</span>
            <span>1.5s</span>
            <span>3.0s</span>
          </div>
        </div>

        {/* Background Music Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-caption text-sm font-medium text-foreground">
              Background Music
            </label>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Add subtle instrumental background
            </p>
          </div>
          <button
            onClick={() => handleChange('backgroundMusic', !settings.backgroundMusic)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.backgroundMusic ? 'bg-primary' : 'bg-muted'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.backgroundMusic ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Subtitles Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-caption text-sm font-medium text-foreground">
              Burned-in Subtitles
            </label>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Add dynamic subtitles with template-based styling
            </p>
          </div>
          <button
            onClick={() => handleChange('subtitles', !settings.subtitles)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${settings.subtitles ? 'bg-primary' : 'bg-muted'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${settings.subtitles ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {settings.subtitles && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-caption text-xs text-blue-900 mb-1">
              ✨ Subtitle Styling
            </p>
            <p className="font-body text-xs text-blue-800">
              Subtitles will automatically match your video template style:
            </p>
            <ul className="mt-2 space-y-1 font-body text-xs text-blue-800">
              <li>• <strong>High Energy:</strong> Impact font, white with yellow highlight, center screen, ALL CAPS</li>
              <li>• <strong>Cinematic:</strong> Elegant font, white with subtle shadow, bottom center, traditional styling</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}