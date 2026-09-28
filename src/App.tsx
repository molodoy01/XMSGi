import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useAssistant } from '@/hooks/useAssistant';
import { useChats } from '@/hooks/useChats';
import { useNotifications } from '@/hooks/useNotifications';
import { useScheduler } from '@/hooks/useScheduler';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import type { Chat } from '@/types';
import { AppShell } from './AppShell';
import { SchedulePage } from './pages/SchedulePage';
import { SettingsPage } from './pages/SettingsPage';

type AppRoute = '/' | '/settings';

function getCurrentHashPath(): AppRoute {
  const hash = window.location.hash.replace(/^#/, '').trim();
  const path = hash ? (hash.startsWith('/') ? hash : `/${hash}`) : '/';

  if (path === '/settings') {
    return path;
  }

  return '/';
}

const MESSAGE_DRAFT_STORAGE_PREFIX = 'xmsgi:message-draft:';
const APP_THEME_STORAGE_KEY = 'xmsgi_theme';

type AppTheme = 'dark' | 'light';

function getInitialTheme(): AppTheme {
  try {
    return window.localStorage.getItem(APP_THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function getMessageDraftStorageKey(chatId: string) {
  return `${MESSAGE_DRAFT_STORAGE_PREFIX}${chatId}`;
}

function App() {
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [route, setRoute] = useState<AppRoute>(getCurrentHashPath());
  const [scheduleActiveTab, setScheduleActiveTab] = useState<'upcoming' | 'sent'>('upcoming');
  const restoringDraftRef = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the selected theme for this session if storage is unavailable.
    }
  }, [theme]);

  const {
    notification,
    showNotification,
    closeNotification,
  } = useNotifications();

  const chatsApiRef = useRef<{
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  } | null>(null);

  const {
    connected,
    signedOut,
    returningUserName,
    connecting,
    connectionResolved,
    authStep,
    showAuthForm,
    phoneNumber,
    phoneCode,
    twoFactorPassword,
    authBusy,
    authError,
    isConfirmingLogout,
    setIsConfirmingLogout,
    setShowAuthForm,
    setAuthStep,
    setPhoneNumber,
    setPhoneCode,
    setTwoFactorPassword,
    setAuthError,
    handleTelegramAuth,
    handleDisconnect,
    handleWelcomeBack,
    handleForgetAccount,
  } = useTelegramAuth({
    showNotification,
    setIsSettingsOpen,
    setChats: (value) => {
      chatsApiRef.current?.setChats(value);
    },
    setSelectedChat: (value) => {
      chatsApiRef.current?.setSelectedChat(value);
    },
  });

  const {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    selectedChatPermissions,
    refreshChatPermissions,
    handleAddChat,
    handleRemoveChat,
  } = useChats({ connected });

  useEffect(() => {
    chatsApiRef.current = {
      setChats,
      setSelectedChat,
    };
  }, [setChats, setSelectedChat]);

  useEffect(() => {
    const chatId = selectedChat?.id;
    restoringDraftRef.current = true;

    if (!chatId) {
      setMessage('');
      return;
    }

    let draft = '';
    try {
      draft = window.localStorage.getItem(getMessageDraftStorageKey(chatId)) ?? '';
    } catch {
      draft = '';
    }
    setMessage(draft);
  }, [selectedChat?.id]);

  useEffect(() => {
    if (restoringDraftRef.current) {
      restoringDraftRef.current = false;
      return;
    }

    const chatId = selectedChat?.id;
    if (!chatId) {
      return;
    }

    const storageKey = getMessageDraftStorageKey(chatId);
    const timeoutId = window.setTimeout(() => {
      try {
        if (message) {
          window.localStorage.setItem(storageKey, message);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // Storage may be unavailable in restricted browser contexts.
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [message, selectedChat?.id]);

  const {
    assistantPrompt,
    setAssistantPrompt,
    assistantResponse,
    setAssistantResponse,
    displayedAssistantResponse,
    assistantIntent,
    setAssistantIntent,
    assistantExampleIndex,
    isThinking,
    geminiSettings,
    settingsKey,
    setSettingsKey,
    settingsBusy,
    settingsError,
    assistantExamples,
    handleSaveGeminiKey,
    handleRemoveGeminiKey,
    handleToggleAssistant,
    handleAssistantSubmit,
  } = useAssistant({ chats });

  const {
    date: personalDate,
    time: personalTime,
    upcoming: personalUpcoming,
    sent: personalSent,
    scheduling: personalScheduling,
    successPulse: personalSuccessPulse,
    revealingId: personalRevealingId,
    cancelingIds: personalCancelingIds,
    sendingIds: personalSendingIds,
    dateEditedRef: personalDateEditedRef,
    timeEditedRef: personalTimeEditedRef,
    openPickerRef: personalOpenPickerRef,
    handleSchedule: handlePersonalSchedule,
    handleCancelMessage: handlePersonalCancelMessage,
    handleSendNow: handlePersonalSendNow,
    handleDeleteMessage: handlePersonalDeleteMessage,
    handleClearSent: handlePersonalClearSent,
    handleClearAll: handlePersonalClearAll,
    setDate: setPersonalDate,
    setTime: setPersonalTime,
  } = useScheduler({
    historyScope: 'personal',
    connected,
    selectedChat,
    refreshChatPermissions,
    chats,
    message,
    showNotification,
    setMessage,
    setAssistantPrompt,
    setAssistantResponse,
    setAssistantIntent,
  });

  useEffect(() => {
    if (isSettingsOpen) {
      setIsConfirmingLogout(false);
    }
  }, [isSettingsOpen, setIsConfirmingLogout]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getCurrentHashPath());
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (route === '/settings') {
      setIsSettingsOpen(true);
    } else {
      setIsSettingsOpen(false);
    }
  }, [route]);

  const navigate = (nextRoute: AppRoute) => {
    const target = nextRoute === '/' ? '#/' : `#${nextRoute}`;
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
    setRoute(nextRoute);
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    if (nextTheme === theme) return;
    const updateTheme = () => flushSync(() => setTheme(nextTheme));

    if (document.startViewTransition) {
      document.startViewTransition(updateTheme);
    } else {
      updateTheme();
    }
  };

  const renderSettingsPage = () => (
    <SettingsPage
      theme={theme}
      onThemeChange={handleThemeChange}
      onClose={() => {
        setShowAuthForm(false);
        setIsSettingsOpen(false);
        navigate('/');
      }}
      geminiSettings={geminiSettings}
      settingsKey={settingsKey}
      settingsBusy={settingsBusy}
      settingsError={settingsError}
      onSettingsKeyChange={setSettingsKey}
      onSaveGeminiKey={handleSaveGeminiKey}
      onRemoveGeminiKey={handleRemoveGeminiKey}
      onToggleAssistant={handleToggleAssistant}
    />
  );

  return (
    <AppShell>
      {route === '/settings' ? (
        renderSettingsPage()
      ) : (
        <SchedulePage
          theme={theme}
          onThemeChange={handleThemeChange}
          message={message}
          setMessage={setMessage}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          notification={notification}
          closeNotification={closeNotification}
          connected={connected}
          signedOut={signedOut}
          returningUserName={returningUserName}
          connecting={connecting}
          connectionResolved={connectionResolved}
          authStep={authStep}
          showAuthForm={showAuthForm}
          phoneNumber={phoneNumber}
          phoneCode={phoneCode}
          twoFactorPassword={twoFactorPassword}
          authBusy={authBusy}
          authError={authError}
          isConfirmingLogout={isConfirmingLogout}
          setIsConfirmingLogout={setIsConfirmingLogout}
          setShowAuthForm={setShowAuthForm}
          setAuthStep={setAuthStep}
          setPhoneNumber={setPhoneNumber}
          setPhoneCode={setPhoneCode}
          setTwoFactorPassword={setTwoFactorPassword}
          setAuthError={setAuthError}
          handleTelegramAuth={handleTelegramAuth}
          handleDisconnect={handleDisconnect}
          handleWelcomeBack={handleWelcomeBack}
          handleForgetAccount={handleForgetAccount}
          chats={chats}
          selectedChat={selectedChat}
          selectedChatPermissions={selectedChatPermissions}
          setSelectedChat={setSelectedChat}
          handleAddChat={handleAddChat}
          handleRemoveChat={handleRemoveChat}
          assistantPrompt={assistantPrompt}
          setAssistantPrompt={setAssistantPrompt}
          assistantResponse={assistantResponse}
          setAssistantResponse={setAssistantResponse}
          displayedAssistantResponse={displayedAssistantResponse}
          assistantIntent={assistantIntent}
          setAssistantIntent={setAssistantIntent}
          assistantExampleIndex={assistantExampleIndex}
          isThinking={isThinking}
          geminiSettings={geminiSettings}
          settingsKey={settingsKey}
          setSettingsKey={setSettingsKey}
          settingsBusy={settingsBusy}
          settingsError={settingsError}
          assistantExamples={assistantExamples}
          handleSaveGeminiKey={handleSaveGeminiKey}
          handleRemoveGeminiKey={handleRemoveGeminiKey}
          handleToggleAssistant={handleToggleAssistant}
          handleAssistantSubmit={handleAssistantSubmit}
          date={personalDate}
          time={personalTime}
          upcoming={personalUpcoming}
          sent={personalSent}
          activeTab={scheduleActiveTab}
          scheduling={personalScheduling}
          successPulse={personalSuccessPulse}
          revealingId={personalRevealingId}
          cancelingIds={personalCancelingIds}
          sendingIds={personalSendingIds}
          dateEditedRef={personalDateEditedRef}
          timeEditedRef={personalTimeEditedRef}
          openPickerRef={personalOpenPickerRef}
          handleSchedule={handlePersonalSchedule}
          handleCancelMessage={handlePersonalCancelMessage}
          handleSendNow={handlePersonalSendNow}
          handleDeleteMessage={handlePersonalDeleteMessage}
          handleClearSent={handlePersonalClearSent}
          handleClearAll={handlePersonalClearAll}
          setActiveTab={setScheduleActiveTab}
          setDate={setPersonalDate}
          setTime={setPersonalTime}
          onOpenSettings={() => {
            setShowAuthForm(false);
            setIsConfirmingLogout(false);
            setIsSettingsOpen(true);
            navigate('/settings');
          }}
          showNotification={showNotification}
        />
      )}
    </AppShell>
  );
}

export default App;