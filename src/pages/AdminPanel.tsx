import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Check
} from 'lucide-react';

const AdminPanel = () => {
  const { t } = useLanguage();
  const { settings, updateSetting, refreshSettings } = useAppSettings();
  const navigate = useNavigate();
  
  const [appName, setAppName] = useState(settings.appName);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingStreamLogo, setIsUploadingStreamLogo] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const streamLogoInputRef = useRef<HTMLInputElement>(null);

  const handleUploadLogo = async (file: File, type: 'app_logo_url' | 'stream_dialog_logo_url') => {
    const isAppLogo = type === 'app_logo_url';
    const setUploading = isAppLogo ? setIsUploadingLogo : setIsUploadingStreamLogo;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
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
    setIsSavingName(true);
    const success = await updateSetting('app_name', appName);
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
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('fileTooLarge'),
          variant: 'destructive',
        });
        return;
      }
      handleUploadLogo(file, type);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
                />
                <Button 
                  onClick={handleSaveAppName}
                  disabled={isSavingName || appName === settings.appName}
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
                    accept="image/*"
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
                    accept="image/*"
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
