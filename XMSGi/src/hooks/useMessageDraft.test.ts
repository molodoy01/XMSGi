import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMessageDraft } from './useMessageDraft';

describe('useMessageDraft', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists the current draft immediately when switching chats', () => {
    window.localStorage.setItem('xmsgi:message-draft:chat-two', 'Saved for chat two');

    const { result, rerender } = renderHook(
      ({ chatId }: { chatId: string }) => {
        const [message, setMessage] = useState('');
        useMessageDraft(chatId, message, setMessage);
        return { message, setMessage };
      },
      { initialProps: { chatId: 'chat-one' } },
    );

    act(() => result.current.setMessage('Rapid draft for chat one'));

    rerender({ chatId: 'chat-two' });

    expect(result.current.message).toBe('Saved for chat two');
    expect(window.localStorage.getItem('xmsgi:message-draft:chat-one'))
      .toBe('Rapid draft for chat one');

    rerender({ chatId: 'chat-one' });

    expect(result.current.message).toBe('Rapid draft for chat one');
  });
});