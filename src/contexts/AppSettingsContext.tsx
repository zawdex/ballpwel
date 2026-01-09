import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSettings {
  appName: string;
  appLogoUrl: string;
  streamDialogLogoUrl: string;
  websiteTitle: string;
  faviconUrl: string;
}

interface AppSettingsContextType {
  settings: AppSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<boolean>;
}

const defaultSettings: AppSettings = {
  appName: 'Live Sports TV',
  appLogoUrl: '',
  streamDialogLogoUrl: '',
  websiteTitle: 'Live Sports TV',
  faviconUrl: '',
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// Update document title dynamically
const updateDocumentTitle = (title: string) => {
  document.title = title || 'Live Sports TV';
};

// Update favicon dynamically
const updateFavicon = (url: string) => {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  if (url) {
    link.href = url;
  } else {
    link.href = '/favicon.ico';
  }
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const newSettings: AppSettings = { ...defaultSettings };
        data.forEach((item) => {
          if (item.setting_key === 'app_name') {
            newSettings.appName = item.setting_value || defaultSettings.appName;
          } else if (item.setting_key === 'app_logo_url') {
            newSettings.appLogoUrl = item.setting_value || '';
          } else if (item.setting_key === 'stream_dialog_logo_url') {
            newSettings.streamDialogLogoUrl = item.setting_value || '';
          } else if (item.setting_key === 'website_title') {
            newSettings.websiteTitle = item.setting_value || defaultSettings.websiteTitle;
          } else if (item.setting_key === 'favicon_url') {
            newSettings.faviconUrl = item.setting_value || '';
          }
        });
        setSettings(newSettings);
        
        // Apply dynamic updates
        updateDocumentTitle(newSettings.websiteTitle);
        updateFavicon(newSettings.faviconUrl);
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
      
      await fetchSettings();
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings, updateSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
