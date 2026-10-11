import { useState, type PropsWithChildren } from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesPanel } from '@/components/MessagesPanel';
import { LocaleProvider } from '@/lib/i18n';
import { saveSent, saveUpcoming } from '@/lib/storage';
import type { ScheduledMessage } from '@/types';
import { useScheduler, type AssistantIntentLike } from './useScheduler';

const scheduledMessage: ScheduledMessage = {
  id: 'scheduled-1',
  chatId: 'chat-1',
  chatName: 'Demo chat',
  text: 'Scheduled message to remove',
  when: '2026-10-10T12:00:00.000Z',
  createdAt: '2026-10-04T12:00:00.000Z',
  status: 'confirmed',
  telegramMessageId: 'telegram-message-1',
};

const sentMessage: ScheduledMessage = {
  ...scheduledMessage,
  id: 'sent-1',
  text: 'Sent message to remove',
  status: 'sent',
  sentAt: '2026-10-04T13:00:00.000Z',
};

type TestNotification = (
  message: string,
  type: 'error' | 'warning' | 'success' | 'info',
  title: string,
) => void;

function SchedulerMessagesPanel({ showNotification }: { showNotification: TestNotification }) {
  const [message, setMessage] = useState('');
  const [, setAssistantPrompt] = useState('');
  const [, setAssistantResponse] = useState('');
  const [, setAssistantIntent] = useState<AssistantIntentLike | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'sent'>('upcoming');
  const scheduler = useScheduler({
    connected: false,
    selectedChat: null,
    chats: [],
    message,
    showNotification,
    setMessage,
    setAssistantPrompt,
    setAssistantResponse,
    setAssistantIntent,
  });

  return (
    <MessagesPanel
      upcoming={scheduler.upcoming}
      sent={scheduler.sent}
      assistantText=""
      revealingId={scheduler.revealingId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onCancel={scheduler.handleCancelMessage}
      onEdit={() => undefined}
      onSendNow={scheduler.handleSendNow}
      onDelete={scheduler.handleDeleteMessage}
      onClearSent={scheduler.handleClearSent}
      onClearAll={scheduler.handleClearAll}
      cancelingIds={scheduler.cancelingIds}
      sendingIds={scheduler.sendingIds}
    />
  );
}

function TestWrapper({ children }: PropsWithChildren) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

function renderSchedulerPanel(showNotification = vi.fn()) {
  return render(
    <SchedulerMessagesPanel showNotification={showNotification} />,
    { wrapper: TestWrapper },
  );
}

function renderSchedulerHook(showNotification = vi.fn()) {
  const setMessage = vi.fn();
  const setAssistantPrompt = vi.fn();
  const setAssistantResponse = vi.fn();
  const setAssistantIntent = vi.fn();

  return renderHook(() => useScheduler({
    connected: false,
    selectedChat: null,
    chats: [],
    message: '',
    showNotification,
    setMessage,
    setAssistantPrompt,
    setAssistantResponse,
    setAssistantIntent,
  }), { wrapper: TestWrapper });
}

describe('scheduled message removal', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('confirm', vi.fn(() => true));
    window.telegram = {
      cancel: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as Window['telegram'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cancels the Telegram schedule before removing it from local state', async () => {
    let resolveCancel!: (result: { success: boolean }) => void;
    const cancelResult = new Promise<{ success: boolean }>((resolve) => {
      resolveCancel = resolve;
    });
    const cancel = vi.fn().mockReturnValue(cancelResult);
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    renderSchedulerPanel();

    const scheduledRow = screen.getByText(scheduledMessage.text).closest<HTMLElement>('.message-row');
    fireEvent.click(within(scheduledRow!).getByRole('button', { name: 'Remove' }));

    expect(cancel).toHaveBeenCalledWith({
      chatId: scheduledMessage.chatId,
      telegramMessageId: scheduledMessage.telegramMessageId,
    });
    expect(screen.getByText(scheduledMessage.text)).toBeInTheDocument();

    await act(async () => {
      resolveCancel({ success: true });
      await cancelResult;
    });

    await waitFor(() => {
      expect(screen.queryByText(scheduledMessage.text)).not.toBeInTheDocument();
    });
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]')).toEqual([]);
  });

  it('keeps the record after cancel failure and allows retry', async () => {
    const cancel = vi.fn()
      .mockResolvedValueOnce({ success: false, error: 'Telegram cancel failed' })
      .mockResolvedValueOnce({ success: true });
    const showNotification = vi.fn();
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    renderSchedulerPanel(showNotification);

    const scheduledRow = screen.getByText(scheduledMessage.text).closest<HTMLElement>('.message-row');
    fireEvent.click(within(scheduledRow!).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        'Telegram cancel failed',
        'error',
        expect.any(String),
      );
    });
    expect(screen.getByText(scheduledMessage.text)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]'))
      .toEqual([scheduledMessage]);

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.queryByText(scheduledMessage.text)).not.toBeInTheDocument();
    });
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it('keeps local-only pending removal and sent-history removal unchanged', async () => {
    const cancel = vi.fn().mockResolvedValue({ success: true });
    const pendingMessage = { ...scheduledMessage, status: 'pending' as const, telegramMessageId: undefined };
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([pendingMessage]);
    saveSent([sentMessage]);
    renderSchedulerPanel();

    const pendingRow = screen.getByText(pendingMessage.text).closest<HTMLElement>('.message-row');
    fireEvent.click(within(pendingRow!).getByRole('button', { name: 'Remove' }));
    await waitFor(() => {
      expect(screen.queryByText(pendingMessage.text)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /History/i }));
    const sentRow = screen.getByText(sentMessage.text).closest<HTMLElement>('.message-row');
    fireEvent.click(within(sentRow!).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(screen.queryByText(sentMessage.text)).not.toBeInTheDocument();
    });
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('send now cancellation recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('marks the message pending when cancel succeeds but immediate send fails', async () => {
    const cancel = vi.fn().mockResolvedValue({ success: true });
    const send = vi.fn().mockResolvedValue({ success: false, error: 'Telegram send failed' });
    const showNotification = vi.fn();
    window.telegram = { cancel, send } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    renderSchedulerPanel(showNotification);

    const row = screen.getByText(scheduledMessage.text).closest<HTMLElement>('.message-row');
    fireEvent.click(within(row!).getByRole('button', { name: 'Send now' }));

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(showNotification).toHaveBeenCalledWith(
        'Telegram send failed',
        'error',
        expect.any(String),
      );
    });

    expect(cancel).toHaveBeenCalledWith({
      chatId: scheduledMessage.chatId,
      telegramMessageId: scheduledMessage.telegramMessageId,
    });
    expect(send).toHaveBeenCalledWith(
      scheduledMessage.chatId,
      scheduledMessage.text,
      [],
      [],
      undefined,
      undefined,
    );
    expect(screen.getByText(scheduledMessage.text)).toBeInTheDocument();
    const [storedMessage] = JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]');
    expect(storedMessage).toMatchObject({ id: scheduledMessage.id, status: 'pending' });
    expect(storedMessage).not.toHaveProperty('telegramMessageId');
    expect(JSON.parse(window.localStorage.getItem('xmsgi_sent') || '[]')).toEqual([]);
  });
});

describe('clear all pending messages', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('confirm', vi.fn(() => true));
    window.telegram = {
      cancel: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as Window['telegram'];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('removes local pending items and cancels remotely scheduled items', async () => {
    const pendingMessage = {
      ...scheduledMessage,
      id: 'pending-1',
      text: 'Pending local message',
      status: 'pending' as const,
      telegramMessageId: undefined,
    };
    const cancel = vi.fn().mockResolvedValue({ success: true });
    const showNotification = vi.fn();
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([pendingMessage, scheduledMessage]);
    renderSchedulerPanel(showNotification);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    await waitFor(() => {
      expect(screen.queryByText(pendingMessage.text)).not.toBeInTheDocument();
      expect(screen.queryByText(scheduledMessage.text)).not.toBeInTheDocument();
    });
    expect(cancel).toHaveBeenCalledWith({
      chatId: scheduledMessage.chatId,
      telegramMessageId: scheduledMessage.telegramMessageId,
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]')).toEqual([]);
    expect(showNotification).toHaveBeenCalledWith(expect.any(String), 'success', expect.any(String));
  });

  it('removes local pending items but keeps remote items whose cancel failed', async () => {
    const pendingMessage = {
      ...scheduledMessage,
      id: 'pending-1',
      text: 'Pending local message',
      status: 'pending' as const,
      telegramMessageId: undefined,
    };
    const cancel = vi.fn().mockResolvedValue({ success: false, error: 'Telegram cancel failed' });
    const showNotification = vi.fn();
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([pendingMessage, scheduledMessage]);
    renderSchedulerPanel(showNotification);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    await waitFor(() => {
      expect(screen.queryByText(pendingMessage.text)).not.toBeInTheDocument();
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), 'warning', expect.any(String));
    });
    expect(screen.getByText(scheduledMessage.text)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]'))
      .toEqual([scheduledMessage]);
  });

  it('keeps unconfirmed in-flight items without a Telegram ID and warns', async () => {
    const inFlightMessage = {
      ...scheduledMessage,
      id: 'in-flight-1',
      text: 'Schedule still being confirmed',
      status: 'scheduled' as const,
      telegramMessageId: undefined,
    };
    const cancel = vi.fn().mockResolvedValue({ success: true });
    const showNotification = vi.fn();
    window.telegram = { cancel } as unknown as Window['telegram'];
    saveUpcoming([inFlightMessage]);
    renderSchedulerPanel(showNotification);

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(expect.any(String), 'warning', expect.any(String));
    });
    expect(screen.getByText(inFlightMessage.text)).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]'))
      .toEqual([inFlightMessage]);
    expect(cancel).not.toHaveBeenCalled();
  });
});

describe('scheduled message editing', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('updates the existing remote schedule and local record only after confirmation', async () => {
    const editScheduledMessage = vi.fn().mockResolvedValue({
      success: true,
      confirmed: true,
      telegramMessageId: scheduledMessage.telegramMessageId,
    });
    const showNotification = vi.fn();
    window.telegram = { editScheduledMessage } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    const { result } = renderSchedulerHook(showNotification);

    let updated = false;
    await act(async () => {
      updated = await result.current.handleEditScheduledMessage(scheduledMessage, {
        message: 'Updated schedule text',
        date: '2026-10-12',
        time: '09:15',
      });
    });

    const targetTimestamp = Math.floor(new Date('2026-10-12T09:15').getTime() / 1000);
    expect(editScheduledMessage).toHaveBeenCalledWith({
      chatId: scheduledMessage.chatId,
      telegramMessageId: scheduledMessage.telegramMessageId,
      message: 'Updated schedule text',
      targetTimestamp,
      entities: [],
    });
    expect(updated).toBe(true);
    expect(result.current.upcoming[0]).toMatchObject({
      id: scheduledMessage.id,
      telegramMessageId: scheduledMessage.telegramMessageId,
      text: 'Updated schedule text',
      when: new Date('2026-10-12T09:15').toISOString(),
      status: 'confirmed',
    });
    expect(showNotification).toHaveBeenCalledWith(
      'Scheduled message updated.',
      'success',
      'Updated',
    );
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]'))
      .toMatchObject([{ id: scheduledMessage.id, text: 'Updated schedule text' }]);
  });

  it('keeps the original schedule intact when Telegram rejects the edit', async () => {
    const editScheduledMessage = vi.fn().mockResolvedValue({
      success: false,
      error: 'Telegram edit failed',
    });
    const showNotification = vi.fn();
    window.telegram = { editScheduledMessage } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    const { result } = renderSchedulerHook(showNotification);

    let updated = true;
    await act(async () => {
      updated = await result.current.handleEditScheduledMessage(scheduledMessage, {
        message: 'Rejected edit',
        date: '2026-10-12',
        time: '09:15',
      });
    });

    expect(updated).toBe(false);
    expect(result.current.upcoming).toEqual([scheduledMessage]);
    expect(JSON.parse(window.localStorage.getItem('xmsgi_upcoming') || '[]'))
      .toEqual([scheduledMessage]);
    expect(showNotification).toHaveBeenCalledWith('Telegram edit failed', 'error', expect.any(String));
  });

  it('treats saving an unchanged edit as a no-op', async () => {
    const editScheduledMessage = vi.fn();
    const showNotification = vi.fn();
    window.telegram = { editScheduledMessage } as unknown as Window['telegram'];
    saveUpcoming([scheduledMessage]);
    const { result } = renderSchedulerHook(showNotification);
    const scheduledAt = new Date(scheduledMessage.when);
    const date = `${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, '0')}-${String(scheduledAt.getDate()).padStart(2, '0')}`;
    const time = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;

    let updated = false;
    await act(async () => {
      updated = await result.current.handleEditScheduledMessage(scheduledMessage, {
        message: scheduledMessage.text,
        date,
        time,
      });
    });

    expect(updated).toBe(true);
    expect(editScheduledMessage).not.toHaveBeenCalled();
    expect(showNotification).not.toHaveBeenCalled();
    expect(result.current.upcoming).toEqual([scheduledMessage]);
  });
});