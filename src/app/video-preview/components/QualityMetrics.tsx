'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface QualityMetric {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface QualityMetricsProps {
  audioClarity: number;
  videoResolution: number;
  synchronization: number;
}

const QualityMetrics = ({ audioClarity, videoResolution, synchronization }: QualityMetricsProps) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  const metrics: QualityMetric[] = [
    {
      label: 'Audio Clarity',
      value: audioClarity,
      icon: 'SpeakerWaveIcon',
      color: audioClarity >= 90 ? 'text-success' : audioClarity >= 70 ? 'text-warning' : 'text-error'
    },
    {
      label: 'Video Resolution',
      value: videoResolution,
      icon: 'VideoCameraIcon',
      color: videoResolution >= 90 ? 'text-success' : videoResolution >= 70 ? 'text-warning' : 'text-error'
    },
    {
      label: 'Synchronization',
      value: synchronization,
      icon: 'ArrowsRightLeftIcon',
      color: synchronization >= 90 ? 'text-success' : synchronization >= 70 ? 'text-warning' : 'text-error'
    }
  ];

  const issueTypes = [
    'Audio Quality Issue',
    'Video Quality Issue',
    'Synchronization Problem',
    'Content Accuracy',
    'Other'
  ];

  const handleSubmitReport = () => {
    if (!issueType || !issueDescription.trim()) {
      alert('Please select an issue type and provide a description.');
      return;
    }

    alert(`Issue reported successfully!\n\nType: ${issueType}\nDescription: ${issueDescription}`);
    setShowReportForm(false);
    setIssueType('');
    setIssueDescription('');
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-glow-soft">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Icon name="ChartBarIcon" size={24} className="text-primary" />
        Quality Metrics
      </h2>

      {/* Metrics Display */}
      <div className="space-y-4 mb-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={metric.icon as any} size={18} className={metric.color} />
                <span className="font-caption text-sm font-medium text-foreground">
                  {metric.label}
                </span>
              </div>
              <span className={`font-caption text-sm font-bold ${metric.color}`}>
                {metric.value}%
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  metric.value >= 90 ? 'bg-success' : metric.value >= 70 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Score */}
      <div className="p-4 rounded-md bg-primary/10 border border-primary/30 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="StarIcon" size={20} className="text-primary" />
            <span className="font-caption text-sm font-semibold text-foreground">
              Overall Quality Score
            </span>
          </div>
          <span className="font-heading text-2xl font-bold text-primary">
            {Math.round((audioClarity + videoResolution + synchronization) / 3)}%
          </span>
        </div>
      </div>

      {/* Report Issue Section */}
      <div className="pt-4 border-t border-border">
        {!showReportForm ? (
          <button
            onClick={() => setShowReportForm(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring"
          >
            <Icon name="ExclamationTriangleIcon" size={20} />
            <span className="font-caption text-sm font-semibold">Report Issue</span>
          </button>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <h3 className="font-caption text-sm font-semibold text-foreground">
              Report Quality Issue
            </h3>
            
            <div>
              <label className="font-caption text-xs text-muted-foreground block mb-2">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-input border border-border text-foreground font-caption text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select issue type...</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-caption text-xs text-muted-foreground block mb-2">
                Description
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={4}
                className="w-full px-4 py-2 rounded-md bg-input border border-border text-foreground font-caption text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmitReport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:shadow-glow-medium transition-all duration-250 focus-ring"
              >
                <Icon name="PaperAirplaneIcon" size={18} />
                <span className="font-caption text-sm font-semibold">Submit Report</span>
              </button>
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setIssueType('');
                  setIssueDescription('');
                }}
                className="px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-all duration-250 focus-ring"
              >
                <span className="font-caption text-sm font-semibold">Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityMetrics;