import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { UserSettings, StudyMode } from '../types';
import GlassCard from '../components/ui/GlassCard';
import GlowingButton from '../components/ui/GlowingButton';
import Badge from '../components/ui/Badge';
import {
  User as UserIcon,
  Settings,
  Key,
  Shield,
  Bell,
  Moon,
  Sun,
  Target,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();

  const [settingsData, setSettingsData] = useState<UserSettings | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [defaultMode, setDefaultMode] = useState<StudyMode>('technical');
  const [dailyTarget, setDailyTarget] = useState<number>(120);
  const [soundEffects, setSoundEffects] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>('dark');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettingsData(data);
      setDefaultMode(data.default_study_mode || 'technical');
      setDailyTarget(data.daily_study_target_minutes || 120);
      setSoundEffects(data.sound_effects);
      setTheme(data.theme || 'dark');
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await api.updateProfile({
        full_name: fullName.trim() || undefined,
        current_password: currentPassword ? currentPassword : undefined,
        password: newPassword ? newPassword : undefined,
      });

      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setStatusMessage({ type: 'success', text: 'Student profile updated successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updated = await api.updateSettings({
        default_study_mode: defaultMode,
        daily_study_target_minutes: dailyTarget,
        sound_effects: soundEffects,
        theme: theme,
        gemini_api_key: geminiApiKey.trim() ? geminiApiKey.trim() : undefined,
      });

      setSettingsData(updated);
      setGeminiApiKey('');
      setStatusMessage({ type: 'success', text: 'Learning preferences & API configuration saved.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OB';

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="pb-2 border-b border-white/[0.06]">
        <span className="text-xs font-mono text-cosmic-cyan tracking-wider uppercase block">
          Account & Engine Controls
        </span>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
          Profile & Intelligence Settings
        </h1>
        <p className="text-xs sm:text-sm text-ui-textSecondary mt-0.5">
          Manage your student credentials, cognitive study preferences, and Google Gemini API keys.
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Section 1: Gemini API Configuration */}
      <GlassCard glow="cyan" className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cosmic-cyan/15 border border-cosmic-cyan/30 flex items-center justify-center text-cosmic-cyan">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white text-base">
                Google Gemini API Key
              </h3>
              <p className="text-xs text-ui-textSecondary">
                Connect your personal API key or use server environment defaults.
              </p>
            </div>
          </div>

          {settingsData?.api_key_configured ? (
            <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
              Active Key Connected
            </Badge>
          ) : (
            <Badge variant="amber" size="sm" icon={<AlertCircle className="w-3 h-3" />}>
              Key Not Set
            </Badge>
          )}
        </div>

        <p className="text-xs text-ui-textSecondary leading-relaxed">
          Get a free Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cosmic-cyan underline">Google AI Studio</a>. Keys are handled strictly server-side and never exposed in browser bundles.
        </p>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
              Update / Enter Gemini API Key
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <GlowingButton
              type="submit"
              variant="cyan"
              size="sm"
              isLoading={isSaving}
              icon={<Sparkles className="w-4 h-4 text-space-950" />}
            >
              Save API Configuration
            </GlowingButton>
          </div>
        </form>
      </GlassCard>

      {/* Section 2: Student Profile Information */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cosmic-violet to-cosmic-blue flex items-center justify-center text-lg font-heading font-bold text-white shadow-lg">
            {userInitials}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-white text-base">
              {user?.full_name}
            </h3>
            <span className="text-xs font-mono text-cosmic-cyan">{user?.email}</span>
            <span className="text-[10px] font-mono text-ui-textMuted block mt-0.5">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                Current Password (to change)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white placeholder-ui-textMuted focus:border-cosmic-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <GlowingButton type="submit" variant="secondary" size="sm" isLoading={isSaving}>
              Save Profile Changes
            </GlowingButton>
          </div>
        </form>
      </GlassCard>

      {/* Section 3: Study Preferences */}
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <h3 className="font-heading font-semibold text-white text-base pb-3 border-b border-white/[0.08] flex items-center gap-2">
          <Settings className="w-4 h-4 text-cosmic-violet" />
          <span>Academic Study Preferences</span>
        </h3>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                Default Study Mode
              </label>
              <select
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value as StudyMode)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
              >
                <option value="beginner">Beginner (Simple English)</option>
                <option value="exam">Exam (Mark-oriented answers)</option>
                <option value="technical">Technical (Architecture & Theory)</option>
                <option value="revision">Quick Revision (Bullet points)</option>
                <option value="coding">Coding (Software & syntax)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-ui-textSecondary mb-1.5 uppercase">
                Daily Study Target (Minutes)
              </label>
              <input
                type="number"
                min={30}
                max={480}
                step={15}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(parseInt(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white focus:border-cosmic-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-space-900/60 border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-cosmic-cyan" />
              <div>
                <span className="text-xs font-medium text-white block">Auditory Feedback</span>
                <span className="text-[11px] text-ui-textSecondary">Sound effects during quiz completion</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-4 h-4 accent-cosmic-cyan rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <GlowingButton type="submit" variant="secondary" size="sm" isLoading={isSaving}>
              Save Preferences
            </GlowingButton>
          </div>
        </form>
      </GlassCard>

      {/* Section 4: Session Logout */}
      <GlassCard className="p-6 flex items-center justify-between border-red-500/20">
        <div>
          <h4 className="text-sm font-heading font-semibold text-white">
            Terminate Session
          </h4>
          <p className="text-xs text-ui-textSecondary mt-0.5">
            Sign out of your account on this device.
          </p>
        </div>

        <GlowingButton
          variant="danger"
          size="sm"
          onClick={logout}
          icon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </GlowingButton>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;

