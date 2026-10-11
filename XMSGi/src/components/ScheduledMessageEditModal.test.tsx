import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '@/lib/i18n';
import type { ScheduledMessage } from '@/types';
import { ScheduledMessageEditModal } from './ScheduledMessageEditModal';

const message: ScheduledMessage = {
  id: 'scheduled-1',
  chatId: 'chat-1',
  chatName: 'Demo chat',
  text: 'Original message',
  when: '2026-10-10T12:00:00.000Z',
  createdAt: '2026-10-04T12:00:00.000Z',
  status: 'confirmed',
  telegramMessageId: 42,
  attachments: ['C:\\photos\\kept.jpg'],
};

describe('ScheduledMessageEditModal', () => {
  it('submits edited text and local date/time and closes only on success', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(
      <LocaleProvider>
        <ScheduledMessageEditModal message={message} isSaving={false} onSave={onSave} onCancel={onCancel} />
      </LocaleProvider>
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
      target: { value: 'Updated message' },
    });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-12' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '09:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        message: 'Updated message',
        date: '2026-10-12',
        time: '09:15',
      });
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Attachments, buttons, and delivery options stay unchanged/)).toBeInTheDocument();
  });

  it('keeps the edit dialog open when saving fails', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const onCancel = vi.fn();
    render(
      <LocaleProvider>
        <ScheduledMessageEditModal message={message} isSaving={false} onSave={onSave} onCancel={onCancel} />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});