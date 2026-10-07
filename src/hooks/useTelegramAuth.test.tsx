import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/lib/i18n';
import { useTelegramAuth } from './useTelegramAuth';

describe('useTelegramAuth browser fallback', () => {
  beforeEach(() => {
    delete (window as any).telegram;
    window.history.pushState({}, '', '/');
  });

  it('resolves startup cleanly when Telegram bridge is unavailable in the browser', async () => {
    const { result } = renderHook(() =>
      useTelegramAuth({
        showNotification: () => undefined,
        closeNotification: () => undefined,
        setIsSettingsOpen: () => undefined,
        setChats: () => undefined,
        setSelectedChat: () => undefined,
      }),
      { wrapper: LocaleProvider },
    );

    await waitFor(() => {
      expect(result.current.connectionResolved).toBe(true);
    });

    expect(result.current.connecting).toBe(false);
    expect(result.current.connected).toBe(false);
    expect(result.current.authError).toBeTruthy();
  });

  it('bypasses Telegram auth when the dev override is enabled', async () => {
    window.history.pushState({}, '', '/?devSkipAuth=1');

    const { result } = renderHook(() =>
      useTelegramAuth({
        showNotification: () => undefined,
        closeNotification: () => undefined,
        setIsSettingsOpen: () => undefined,
        setChats: () => undefined,
        setSelectedChat: () => undefined,
      }),
      { wrapper: LocaleProvider },
    );

    await waitFor(() => {
      expect(result.current.connectionResolved).toBe(true);
    });

    expect(result.current.connecting).toBe(false);
    expect(result.current.connected).toBe(true);
    expect(result.current.showAuthForm).toBe(false);
    expect(result.current.authError).toBe('');
  });
});
