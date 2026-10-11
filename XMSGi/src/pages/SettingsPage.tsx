import { SettingsView } from '@/components/SettingsView';

type SettingsPageProps = {
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onClose: () => void;
  geminiSettings: {
    hasKey: boolean;
    maskedKey: string;
    enabled: boolean;
    encryptionAvailable: boolean;
  };
  settingsKey: string;
  settingsBusy: boolean;
  settingsError: string;
  onSettingsKeyChange: (value: string) => void;
  onSaveGeminiKey: () => void;
  onRemoveGeminiKey: () => void;
  onToggleAssistant: () => void;
};

export function SettingsPage({
  theme,
  onThemeChange,
  onClose,
  geminiSettings,
  settingsKey,
  settingsBusy,
  settingsError,
  onSettingsKeyChange,
  onSaveGeminiKey,
  onRemoveGeminiKey,
  onToggleAssistant,
}: SettingsPageProps) {
  return (
    <SettingsView
      theme={theme}
      onThemeChange={onThemeChange}
      onClose={onClose}
      geminiSettings={geminiSettings}
      settingsKey={settingsKey}
      settingsBusy={settingsBusy}
      settingsError={settingsError}
      onSettingsKeyChange={onSettingsKeyChange}
      onSaveGeminiKey={onSaveGeminiKey}
      onRemoveGeminiKey={onRemoveGeminiKey}
      onToggleAssistant={onToggleAssistant}
    />
  );
}
