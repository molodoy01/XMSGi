import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';
import type { Chat } from '@/types';
import { LocaleProvider } from '@/lib/i18n';
import { ChatPreviewStand } from './ChatPreviewStand';

const chats: Chat[] = [
  { id: 'chat-1', name: 'Saved Messages', type: 'private' },
  { id: 'chat-2', name: 'Design Group', type: 'group' },
];

function renderStand(chatListOpen = true) {
  const previewFeedRef = { current: null } as MutableRefObject<HTMLDivElement | null>;
  const onSelectChat = vi.fn();
  const onToggleChatList = vi.fn();

  render(
    <LocaleProvider>
      <ChatPreviewStand
        chats={chats}
        selectedChat={chats[0]}
        previewHistory={null}
        previewHistoryLoading={false}
        previewHistoryError=""
        previewHistoryRetry={vi.fn()}
        previewFeedRef={previewFeedRef}
        draftText=""
        draftEntities={[]}
        inlineButtons={[]}
        attachments={[]}
        previewTime="12:00"
        collapsed={false}
        chatListOpen={chatListOpen}
        onToggleChatList={onToggleChatList}
        onSelectChat={onSelectChat}
      />
    </LocaleProvider>,
  );

  return { onSelectChat, onToggleChatList };
}

describe('ChatPreviewStand DOM behavior', () => {
  it('renders the current chat list and selects another chat', () => {
    const { onSelectChat } = renderStand();

    expect(screen.getByRole('complementary', { name: 'Chats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Design Group/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Design Group/ }));
    expect(onSelectChat).toHaveBeenCalledWith(chats[1]);
  });

  it('uses the chat toggle control when the list is closed', () => {
    const { onToggleChatList } = renderStand(false);

    fireEvent.click(screen.getByRole('button', { name: 'Show chats' }));
    expect(onToggleChatList).toHaveBeenCalledTimes(1);
  });

  it('deduplicates uploaded wallpapers and removes them cleanly from the picker', () => {
    const image = 'data:image/png;base64,abc123';
    window.localStorage.setItem('xmsgi-chat-preview-wallpaper', JSON.stringify({
      theme: 'custom',
      image,
      accent: '',
      wallpapers: [image, image],
    }));

    renderStand();

    fireEvent.click(screen.getByRole('button', { name: 'Choose chat background' }));

    expect(screen.getAllByRole('button', { name: /^Uploaded background/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Remove uploaded background 1' }));
    expect(screen.queryByRole('button', { name: /^Uploaded background/i })).not.toBeInTheDocument();
  });
});
