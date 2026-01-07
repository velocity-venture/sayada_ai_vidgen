'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { storageService } from '../../services/storage';
import { UserProfile, EmailPreferences, UserSubscription, SecuritySettings, ActiveSession } from '../../types/models';
import Header from '../../components/common/Header';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'email' | 'subscription' | 'security'>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    ministryAffiliation: '',
    bio: '',
    phone: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { profile: profileData, emailPreferences, subscription: subData, securitySettings: secData, error: profileError } = 
        await profileService.getProfile(user.id);

      if (profileError) throw profileError;

      setProfile(profileData);
      setEmailPrefs(emailPreferences);
      setSubscription(subData);
      setSecuritySettings(secData);

      if (profileData) {
        setProfileForm({
          fullName: profileData.fullName || '',
          ministryAffiliation: profileData.ministryAffiliation || '',
          bio: profileData.bio || '',
          phone: profileData.phone || '',
        });
      }

      // Load active sessions
      const { data: sessions, error: sessionsError } = await profileService.getActiveSessions(user.id);
      if (sessionsError) throw sessionsError;
      setActiveSessions(sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const { error: updateError } = await profileService.updateProfile(user.id, {
        fullName: profileForm.fullName,
        ministryAffiliation: profileForm.ministryAffiliation,
        bio: profileForm.bio,
        phone: profileForm.phone,
      });

      if (updateError) throw updateError;

      setSuccessMessage('Profile updated successfully');
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPreferencesUpdate = async (field: keyof EmailPreferences, value: boolean | string) => {
    if (!user?.id || !emailPrefs) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updates: Partial<EmailPreferences> = { [field]: value };
      const { error: updateError } = await profileService.updateEmailPreferences(user.id, updates);

      if (updateError) throw updateError;

      setSuccessMessage('Preferences updated successfully');
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id || !e.target.files?.[0]) return;

    try {
      setSaving(true);
      setError(null);

      const file = e.target.files[0];
      const { data, error: uploadError } = await storageService.uploadFile(
        'avatars',
        file,
        `${user.id}/avatar`
      );

      if (uploadError) throw uploadError;

      const { error: updateError } = await profileService.updateProfile(user.id, {
        avatarUrl: data?.publicUrl || '',
      });

      if (updateError) throw updateError;

      setSuccessMessage('Avatar updated successfully');
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!user?.id) return;

    try {
      setError(null);
      const { error: revokeError } = await profileService.revokeSession(sessionId, user.id);
      if (revokeError) throw revokeError;
      await loadProfileData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-purple-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-800">
          <div className="flex space-x-8">
            {[
              { id: 'account' as const, label: 'Account Information' },
              { id: 'email' as const, label: 'Email Preferences' },
              { id: 'subscription' as const, label: 'Subscription' },
              { id: 'security' as const, label: 'Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400' :'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          {activeTab === 'account' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-500">
                        {profile?.fullName?.charAt(0) || user?.email?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
                  >
                    Change Photo
                  </label>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Ministry Affiliation */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ministry Affiliation
                </label>
                <input
                  type="text"
                  value={profileForm.ministryAffiliation}
                  onChange={(e) => setProfileForm({ ...profileForm, ministryAffiliation: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Church or organization name"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tell us about yourself and your ministry"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'email' && emailPrefs && (
            <div className="space-y-6">
              <p className="text-gray-400 mb-6">
                Choose what email notifications you would like to receive
              </p>

              {/* Notification toggles */}
              {[
                { key: 'videoCompletionAlerts' as const, label: 'Video Completion Alerts', description: 'Get notified when your videos finish processing' },
                { key: 'platformUpdates' as const, label: 'Platform Updates', description: 'News about new features and improvements' },
                { key: 'scriptureRecommendations' as const, label: 'Scripture Recommendations', description: 'Weekly scripture suggestions for video creation' },
                { key: 'marketingCommunications' as const, label: 'Marketing Communications', description: 'Special offers and promotional content' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-start justify-between py-4 border-b border-gray-800">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{pref.label}</h3>
                    <p className="text-sm text-gray-400 mt-1">{pref.description}</p>
                  </div>
                  <button
                    onClick={() => handleEmailPreferencesUpdate(pref.key, !emailPrefs[pref.key])}
                    disabled={saving}
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      emailPrefs[pref.key] ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        emailPrefs[pref.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              {/* Frequency selector */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Notification Frequency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['instant', 'daily', 'weekly', 'never'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => handleEmailPreferencesUpdate('notificationFrequency', freq)}
                      disabled={saving}
                      className={`py-2 px-4 rounded-lg font-medium capitalize transition-colors ${
                        emailPrefs.notificationFrequency === freq
                          ? 'bg-purple-600 text-white' :'bg-gray-800 text-gray-400 hover:bg-gray-750'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && subscription && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white capitalize">{subscription.tier} Plan</h3>
                  <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-gray-400 mb-4">
                  Started on {new Date(subscription.subscriptionStartDate).toLocaleDateString()}
                </p>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-gray-400 text-sm mb-2">Videos This Month</h4>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-white">
                      {subscription.videosGeneratedThisMonth}
                    </span>
                    <span className="text-gray-500">/ {subscription.monthlyVideoLimit}</span>
                  </div>
                  <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (subscription.videosGeneratedThisMonth / subscription.monthlyVideoLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-gray-400 text-sm mb-2">Storage Used</h4>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-white">
                      {subscription.storageUsedMb}
                    </span>
                    <span className="text-gray-500">MB / {subscription.storageLimitMb} MB</span>
                  </div>
                  <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (subscription.storageUsedMb / subscription.storageLimitMb) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Upgrade Options */}
              <div className="pt-4">
                <h3 className="text-white font-medium mb-4">Upgrade Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { tier: 'basic', price: '$9.99', videos: 25, storage: '2GB' },
                    { tier: 'pro', price: '$29.99', videos: 100, storage: '10GB' },
                    { tier: 'enterprise', price: '$99.99', videos: 'Unlimited', storage: '50GB' },
                  ].map((plan) => (
                    <div
                      key={plan.tier}
                      className={`border rounded-lg p-6 ${
                        subscription.tier === plan.tier
                          ? 'border-purple-500 bg-purple-900/20' :'border-gray-700 bg-gray-800/30'
                      }`}
                    >
                      <h4 className="text-white font-bold capitalize mb-2">{plan.tier}</h4>
                      <p className="text-2xl font-bold text-purple-400 mb-4">{plan.price}/mo</p>
                      <ul className="space-y-2 text-sm text-gray-400 mb-4">
                        <li>✓ {plan.videos} videos/month</li>
                        <li>✓ {plan.storage} storage</li>
                        <li>✓ Priority support</li>
                      </ul>
                      {subscription.tier !== plan.tier && (
                        <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                          Upgrade
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && securitySettings && (
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="border-b border-gray-800 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <button
                    className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.twoFactorEnabled ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Password Change */}
              <div className="border-b border-gray-800 pb-6">
                <h3 className="text-white font-medium mb-2">Change Password</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Last changed: {new Date(securitySettings.lastPasswordChange).toLocaleDateString()}
                </p>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-white rounded-lg transition-colors">
                  Change Password
                </button>
              </div>

              {/* Active Sessions */}
              <div>
                <h3 className="text-white font-medium mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {activeSessions?.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {session.deviceName || 'Unknown Device'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {session.browser || 'Unknown Browser'} • {session.ipAddress || 'Unknown IP'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}