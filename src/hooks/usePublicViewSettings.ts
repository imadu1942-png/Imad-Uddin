import { useState, useEffect, useCallback } from 'react';
import { PublicViewSettings, DEFAULT_PUBLIC_VIEW_SETTINGS } from '../types/database.types';
import { databaseService } from '../services/databaseService';

export function usePublicViewSettings() {
  const [settings, setSettings] = useState<PublicViewSettings>(DEFAULT_PUBLIC_VIEW_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    setSettingsError(null);
    try {
      const data = await databaseService.getPublicViewSettings();
      setSettings(data);
    } catch (err: any) {
      console.warn('Failed to load public view settings:', err);
      setSettingsError(err?.message || 'পাবলিক ভিউ সেটিংস লোড করা যায়নি');
      // Keep defaults gracefully
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (
    newSettings: Partial<PublicViewSettings>,
    userFullName?: string
  ): Promise<boolean> => {
    try {
      const updated = await databaseService.updatePublicViewSettings(newSettings, userFullName);
      setSettings(updated);
      setSettingsError(null);
      return true;
    } catch (err: any) {
      console.error('Failed to update public view settings:', err);
      throw err;
    }
  };

  return {
    settings,
    isLoadingSettings,
    settingsError,
    updateSettings,
    reloadSettings: loadSettings,
  };
}
