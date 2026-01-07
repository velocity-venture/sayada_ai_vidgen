'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import { socialMediaExportService } from '@/services/socialMediaExportService';
import { projectService } from '@/services/projectService';
import { ScheduledPost, SocialPlatform, ExportStatus, Project } from '@/types/models';

interface PlatformConfig {
  selected: boolean;
  caption: string;
  hashtags: string[];
  customSettings: Record<string, any>;
}

export default function SocialMediaExport() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'configure' | 'schedule' | 'history'>('configure');
  
  const [platformConfigs, setPlatformConfigs] = useState<Record<SocialPlatform, PlatformConfig>>({
    youtube: {
      selected: false,
      caption: '',
      hashtags: [],
      customSettings: { category: 'People & Blogs', visibility: 'public' }
    },
    instagram: {
      selected: false,
      caption: '',
      hashtags: [],
      customSettings: { feedType: 'post', storyDuration: 24 }
    },
    facebook: {
      selected: false,
      caption: '',
      hashtags: [],
      customSettings: { pageId: '', targetAudience: 'public' }
    },
    twitter: {
      selected: false,
      caption: '',
      hashtags: [],
      customSettings: { isThread: false, maxLength: 280 }
    }
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    scheduledTime: '',
    timezone: 'UTC',
    recurring: false,
    recurringPattern: 'daily',
    useOptimalTime: false
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [projectsData, postsData] = await Promise.all([
        projectService.getUserProjects(user.id),
        socialMediaExportService.getScheduledPosts(user.id)
      ]);
      
      setProjects(projectsData?.filter(p => p?.status === 'completed') || []);
      setScheduledPosts(postsData || []);
      
      if (projectsData && projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
        generateDefaultCaptions(projectsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultCaptions = (project: Project) => {
    const baseCaption = project?.title || 'Check out this amazing video!';
    const scriptureRef = project?.scriptContent?.split('\n')?.[0] || '';
    
    setPlatformConfigs(prev => ({
      youtube: {
        ...prev.youtube,
        caption: `${baseCaption}\n\n${scriptureRef}\n\nSubscribe for more inspirational content!`,
        hashtags: ['scripture', 'faith', 'inspiration', 'spirituality']
      },
      instagram: {
        ...prev.instagram,
        caption: `${baseCaption} ✨\n\n${scriptureRef}`,
        hashtags: ['faith', 'hope', 'scripture', 'dailyverse', 'inspiration']
      },
      facebook: {
        ...prev.facebook,
        caption: `${baseCaption}\n\n${scriptureRef}\n\nShare this message with someone who needs it today!`,
        hashtags: ['faith', 'scripture', 'inspiration']
      },
      twitter: {
        ...prev.twitter,
        caption: `${scriptureRef}\n\n${baseCaption}`,
        hashtags: ['faith', 'scripture', 'hope']
      }
    }));
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects?.find(p => p?.id === projectId);
    if (project) {
      setSelectedProject(project);
      generateDefaultCaptions(project);
    }
  };

  const handlePlatformToggle = (platform: SocialPlatform) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        selected: !prev[platform]?.selected
      }
    }));
  };

  const handleCaptionChange = (platform: SocialPlatform, caption: string) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        caption
      }
    }));
  };

  const handleHashtagsChange = (platform: SocialPlatform, hashtags: string) => {
    const hashtagArray = hashtags
      ?.split(',')
      ?.map(tag => tag?.trim()?.replace(/^#/, ''))
      ?.filter(Boolean) || [];
    
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        hashtags: hashtagArray
      }
    }));
  };

  const getCharacterCount = (platform: SocialPlatform) => {
    const caption = platformConfigs[platform]?.caption || '';
    const hashtags = platformConfigs[platform]?.hashtags?.join(' #') || '';
    const total = caption.length + (hashtags ? hashtags.length + 2 : 0);
    
    const limits: Record<SocialPlatform, number> = {
      youtube: 5000,
      instagram: 2200,
      facebook: 63206,
      twitter: 280
    };
    
    return { current: total, max: limits[platform] };
  };

  const handleSchedulePost = async () => {
    if (!user?.id || !selectedProject?.id) return;
    
    const selectedPlatforms = Object.entries(platformConfigs)
      .filter(([_, config]) => config?.selected)
      .map(([platform]) => platform as SocialPlatform);
    
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    
    if (!scheduleSettings.scheduledTime) {
      alert('Please select a schedule time');
      return;
    }
    
    try {
      setExporting(true);
      
      const scheduledTime = new Date(scheduleSettings.scheduledTime).toISOString();
      
      for (const platform of selectedPlatforms) {
        const config = platformConfigs[platform];
        
        await socialMediaExportService.createScheduledPost({
          projectId: selectedProject.id,
          userId: user.id,
          platform,
          caption: config?.caption || '',
          hashtags: config?.hashtags || [],
          scheduledTime,
          timezone: scheduleSettings.timezone,
          status: 'scheduled' as ExportStatus,
          thumbnailUrl: selectedProject.videoUrl,
          twitterIsThread: platform === 'twitter' && config?.customSettings?.isThread,
          recurringPattern: scheduleSettings.recurring ? scheduleSettings.recurringPattern : undefined,
          optimalPostingTime: scheduleSettings.useOptimalTime
        });
      }
      
      await loadData();
      alert('Posts scheduled successfully!');
      setActiveTab('schedule');
    } catch (error) {
      console.error('Error scheduling posts:', error);
      alert('Failed to schedule posts. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteScheduledPost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) return;
    
    try {
      await socialMediaExportService.deleteScheduledPost(postId);
      await loadData();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const renderPlatformIcon = (platform: SocialPlatform) => {
    const icons: Record<SocialPlatform, string> = {
      youtube: '▶️',
      instagram: '📷',
      facebook: '👥',
      twitter: '🐦'
    };
    return icons[platform];
  };

  const renderStatusBadge = (status: ExportStatus) => {
    const colors: Record<ExportStatus, string> = {
      draft: 'bg-gray-500',
      scheduled: 'bg-blue-500',
      publishing: 'bg-yellow-500',
      published: 'bg-green-500',
      failed: 'bg-red-500',
      cancelled: 'bg-gray-400'
    };
    
    return (
      <span className={`${colors[status]} text-white px-3 py-1 rounded-full text-xs font-medium`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Social Media Export</h1>
          <p className="text-gray-400">Schedule and manage your video posts across multiple platforms</p>
        </div>

        {projects?.length === 0 ? (
          <div className="bg-[#151B2E] rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Completed Videos</h2>
            <p className="text-gray-400 mb-6">Create and complete a video project first before exporting to social media</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-white text-sm font-medium mb-2 block">Select Video</label>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full bg-[#151B2E] text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                {projects?.map(project => (
                  <option key={project?.id} value={project?.id}>
                    {project?.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#151B2E] rounded-lg mb-6">
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('configure')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'configure' ?'text-purple-400 border-b-2 border-purple-400' :'text-gray-400 hover:text-white'
                  }`}
                >
                  Configure Export
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'schedule' ?'text-purple-400 border-b-2 border-purple-400' :'text-gray-400 hover:text-white'
                  }`}
                >
                  Scheduled Posts ({scheduledPosts?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === 'history' ?'text-purple-400 border-b-2 border-purple-400' :'text-gray-400 hover:text-white'
                  }`}
                >
                  Export History
                </button>
              </div>

              {activeTab === 'configure' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {selectedProject?.videoUrl && (
                        <div className="bg-[#0A0F1E] rounded-lg p-4">
                          <h3 className="text-white font-medium mb-3">Video Preview</h3>
                          <video
                            src={selectedProject.videoUrl}
                            controls
                            className="w-full rounded-lg"
                          />
                        </div>
                      )}

                      <div className="bg-[#0A0F1E] rounded-lg p-4">
                        <h3 className="text-white font-medium mb-3">Schedule Settings</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-400 text-sm mb-2 block">Schedule Time</label>
                            <input
                              type="datetime-local"
                              value={scheduleSettings.scheduledTime}
                              onChange={(e) => setScheduleSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                              className="w-full bg-[#151B2E] text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-gray-400 text-sm mb-2 block">Timezone</label>
                            <select
                              value={scheduleSettings.timezone}
                              onChange={(e) => setScheduleSettings(prev => ({ ...prev, timezone: e.target.value }))}
                              className="w-full bg-[#151B2E] text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                            >
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">EST</option>
                              <option value="America/Chicago">CST</option>
                              <option value="America/Denver">MST</option>
                              <option value="America/Los_Angeles">PST</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={scheduleSettings.useOptimalTime}
                              onChange={(e) => setScheduleSettings(prev => ({ ...prev, useOptimalTime: e.target.checked }))}
                              className="w-5 h-5 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                            />
                            <label className="text-white text-sm">Use Optimal Posting Time</label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={scheduleSettings.recurring}
                              onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurring: e.target.checked }))}
                              className="w-5 h-5 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                            />
                            <label className="text-white text-sm">Recurring Post</label>
                          </div>

                          {scheduleSettings.recurring && (
                            <select
                              value={scheduleSettings.recurringPattern}
                              onChange={(e) => setScheduleSettings(prev => ({ ...prev, recurringPattern: e.target.value }))}
                              className="w-full bg-[#151B2E] text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {(['youtube', 'instagram', 'facebook', 'twitter'] as SocialPlatform[]).map(platform => (
                        <div key={platform} className="bg-[#0A0F1E] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{renderPlatformIcon(platform)}</span>
                              <h3 className="text-white font-medium capitalize">{platform}</h3>
                            </div>
                            <input
                              type="checkbox"
                              checked={platformConfigs[platform]?.selected || false}
                              onChange={() => handlePlatformToggle(platform)}
                              className="w-5 h-5 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                            />
                          </div>

                          {platformConfigs[platform]?.selected && (
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="text-gray-400 text-sm">Caption</label>
                                  <span className="text-xs text-gray-500">
                                    {getCharacterCount(platform).current} / {getCharacterCount(platform).max}
                                  </span>
                                </div>
                                <textarea
                                  value={platformConfigs[platform]?.caption || ''}
                                  onChange={(e) => handleCaptionChange(platform, e.target.value)}
                                  rows={3}
                                  className="w-full bg-[#151B2E] text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-purple-500 resize-none"
                                  placeholder={`Write your ${platform} caption...`}
                                />
                              </div>

                              <div>
                                <label className="text-gray-400 text-sm mb-2 block">Hashtags (comma separated)</label>
                                <input
                                  type="text"
                                  value={platformConfigs[platform]?.hashtags?.join(', ') || ''}
                                  onChange={(e) => handleHashtagsChange(platform, e.target.value)}
                                  className="w-full bg-[#151B2E] text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-purple-500"
                                  placeholder="faith, hope, scripture"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => generateDefaultCaptions(selectedProject!)}
                      className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Reset Captions
                    </button>
                    <button
                      onClick={handleSchedulePost}
                      disabled={exporting || !selectedProject}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {exporting ? 'Scheduling...' : 'Schedule Posts'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="p-6">
                  {scheduledPosts?.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-bold text-white mb-2">No Scheduled Posts</h3>
                      <p className="text-gray-400">Schedule your first post to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts?.map(post => (
                        <div key={post?.id} className="bg-[#0A0F1E] rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{renderPlatformIcon(post?.platform)}</span>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-white font-medium capitalize">{post?.platform}</h4>
                                {renderStatusBadge(post?.status)}
                              </div>
                              <p className="text-gray-400 text-sm line-clamp-2">{post?.caption}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                Scheduled: {new Date(post?.scheduledTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteScheduledPost(post?.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-white mb-2">Export History</h3>
                    <p className="text-gray-400">View your published posts and their performance metrics</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}