import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Upload, 
  Image, 
  Type, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Trash2,
  Monitor,
  Film,
  Check,
  ShieldAlert,
  LogOut
} from 'lucide-react';

// Allowed file types for upload
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const AdminPanel = () => {
  const { t } = useLanguage();
  const { settings, updateSetting } = useAppSettings();
  const { user, isLoading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [appName, setAppName] = useState(settings.appName);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStreamLogo, setIsUploadingStreamLogo] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const streamLogoInputRef = useRef<HTMLInputElement>(null);

  // Update appName when settings load
  useEffect(() => {
    setAppName(settings.appName);
  }, [settings.appName]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, SVG, or WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('fileTooLarge');
    }
    return null;
  };

  const handleUploadLogo = async (file: File, type: 'app_logo_url' | 'stream_dialog_logo_url') => {
    const isAppLogo = type === 'app_logo_url';
    const setUploading = isAppLogo ? setIsUploadingLogo : setIsUploadingStreamLogo;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${type.replace('_url', '')}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      const success = await updateSetting(type, publicUrl);
      
      if (success) {
        toast({
          title: t('success'),
          description: isAppLogo ? t('logoUpdated') : t('streamLogoUpdated'),
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('error'),
        description: t('uploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async (type: 'app_logo_url' | 'stream_dialog_logo_url') => {
    const success = await updateSetting(type, '');
    if (success) {
      toast({
        title: t('success'),
        description: t('logoRemoved'),
      });
    }
  };

  const handleSaveAppName = async () => {
    // Validate app name
    const trimmedName = appName.trim();
    if (!trimmedName || trimmedName.length > 50) {
      toast({
        title: t('error'),
        description: 'App name must be between 1 and 50 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingName(true);
    const success = await updateSetting('app_name', trimmedName);
    setIsSavingName(false);
    
    if (success) {
      toast({
        title: t('success'),
        description: t('appNameUpdated'),
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'app_logo_url' | 'stream_dialog_logo_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: t('error'),
          description: error,
          variant: 'destructive',
        });
        return;
      }
      handleUploadLogo(file, type);
    }
    // Reset input
    e.target.value = '';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-xl bg-destructive/10 w-fit">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this panel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Contact an administrator to request access.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('adminPanel')}</h1>
                <p className="text-sm text-muted-foreground">{t('adminPanelDesc')}</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-6">
          {/* App Name Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Type className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('appName')}</CardTitle>
                  <CardDescription>{t('appNameDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder={t('enterAppName')}
                  className="flex-1"
                  maxLength={50}
                />
                <Button 
                  onClick={handleSaveAppName}
                  disabled={isSavingName || appName.trim() === settings.appName}
                  className="gap-2"
                >
                  {isSavingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t('save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Logo Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Monitor className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('appLogo')}</CardTitle>
                  <CardDescription>{t('appLogoDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings.appLogoUrl ? (
                    <img 
                      src={settings.appLogoUrl} 
                      alt="App Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'app_logo_url')}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="gap-2"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {t('uploadLogo')}
                    </Button>
                    
                    {settings.appLogoUrl && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLogo('app_logo_url')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('logoRequirements')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Dialog Logo Setting */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Film className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('streamDialogLogo')}</CardTitle>
                  <CardDescription>{t('streamDialogLogoDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden">
                  {settings.streamDialogLogoUrl ? (
                    <img 
                      src={settings.streamDialogLogoUrl} 
                      alt="Stream Dialog Logo" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <input
                    ref={streamLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'stream_dialog_logo_url')}
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => streamLogoInputRef.current?.click()}
                      disabled={isUploadingStreamLogo}
                      className="gap-2"
                    >
                      {isUploadingStreamLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {t('uploadLogo')}
                    </Button>
                    
                    {settings.streamDialogLogoUrl && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveLogo('stream_dialog_logo_url')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {t('logoRequirements')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Settings Preview */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('currentSettings')}</CardTitle>
                  <CardDescription>{t('currentSettingsDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('appName')}</Label>
                  <p className="font-medium mt-1">{settings.appName}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('appLogo')}</Label>
                  <p className="font-medium mt-1 truncate">
                    {settings.appLogoUrl ? t('uploaded') : t('notSet')}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <Label className="text-xs text-muted-foreground">{t('streamDialogLogo')}</Label>
                  <p className="font-medium mt-1 truncate">
                    {settings.streamDialogLogoUrl ? t('uploaded') : t('notSet')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
