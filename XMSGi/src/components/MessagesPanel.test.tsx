import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessagesPanel } from './MessagesPanel';
import type { ScheduledMessage } from '@/types';
import { LocaleProvider } from '@/lib/i18n';
import { formatDateTime } from '@/lib/utils';

const upcoming: ScheduledMessage[] = [
  {
    id: 'u1',
    chatId: 'chat-1',
    chatName: 'Demo chat',
    text: 'First scheduled message',
    when: '2026-09-20T12:00:00.000Z',
    createdAt: '2026-09-20T11:00:00.000Z',
    status: 'scheduled',
  },
];

const sent: ScheduledMessage[] = [
  {
    id: 's1',
    chatId: 'chat-1',
    chatName: 'Demo chat',
    text: 'Already sent message',
    when: '2026-09-19T10:00:00.000Z',
    createdAt: '2026-09-19T09:00:00.000Z',
    status: 'sent',
    sentAt: '2026-09-21T14:30:00.000Z',
  },
];

describe('MessagesPanel', () => {
  it('renders queue and history tabs with counts', () => {
    render(
      <LocaleProvider>
        <MessagesPanel
        upcoming={upcoming}
        sent={sent}
        assistantText=""
        revealingId={null}
        activeTab="upcoming"
        onTabChange={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onSendNow={vi.fn()}
        onDelete={vi.fn()}
        onClearSent={vi.fn()}
        onClearAll={vi.fn()}
        cancelingIds={new Set()}
        sendingIds={new Set()}
        />
      </LocaleProvider>
    );

    expect(screen.getByRole('button', { name: /Upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('switches to the history tab when clicked', () => {
    const onTabChange = vi.fn();

    render(
      <LocaleProvider>
        <MessagesPanel
        upcoming={upcoming}
        sent={sent}
        assistantText=""
        revealingId={null}
        activeTab="upcoming"
        onTabChange={onTabChange}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onSendNow={vi.fn()}
        onDelete={vi.fn()}
        onClearSent={vi.fn()}
        onClearAll={vi.fn()}
        cancelingIds={new Set()}
        sendingIds={new Set()}
        />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /History/i }));
    expect(onTabChange).toHaveBeenCalledWith('sent');
  });

  it('shows the clear action only on the sent tab and calls the handler', () => {
    const onClearSent = vi.fn();

    render(
      <LocaleProvider>
        <MessagesPanel
        upcoming={upcoming}
        sent={sent}
        assistantText=""
        revealingId={null}
        activeTab="sent"
        onTabChange={vi.fn()}
        onCancel={vi.fn()}
        onEdit={vi.fn()}
        onSendNow={vi.fn()}
        onDelete={vi.fn()}
        onClearSent={onClearSent}
        onClearAll={vi.fn()}
        cancelingIds={new Set()}
        sendingIds={new Set()}
        />
      </LocaleProvider>
    );

    const clearButton = screen.getByRole('button', { name: /Clear history/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(onClearSent).toHaveBeenCalledTimes(1);
  });

  it('shows the actual sent time in history instead of the scheduled time', () => {
    render(
      <LocaleProvider>
        <MessagesPanel
          upcoming={upcoming}
          sent={sent}
          assistantText=""
          revealingId={null}
          activeTab="sent"
          onTabChange={vi.fn()}
          onCancel={vi.fn()}
          onEdit={vi.fn()}
          onSendNow={vi.fn()}
          onDelete={vi.fn()}
          onClearSent={vi.fn()}
          onClearAll={vi.fn()}
          cancelingIds={new Set()}
          sendingIds={new Set()}
        />
      </LocaleProvider>
    );

    expect(screen.getByText(formatDateTime(sent[0].sentAt!))).toBeInTheDocument();
    expect(screen.queryByText(formatDateTime(sent[0].when))).not.toBeInTheDocument();
  });

  it('offers an edit action for a scheduled message with a Telegram ID', () => {
    const onEdit = vi.fn();
    const editableMessage = { ...upcoming[0], telegramMessageId: 456 };
    render(
      <LocaleProvider>
        <MessagesPanel
          upcoming={[editableMessage]}
          sent={sent}
          assistantText=""
          revealingId={null}
          activeTab="upcoming"
          onTabChange={vi.fn()}
          onCancel={vi.fn()}
          onEdit={onEdit}
          onSendNow={vi.fn()}
          onDelete={vi.fn()}
          onClearSent={vi.fn()}
          onClearAll={vi.fn()}
          cancelingIds={new Set()}
          sendingIds={new Set()}
        />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledWith(editableMessage);
  });
});
