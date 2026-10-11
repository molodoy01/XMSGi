import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const MESSAGE_DRAFT_STORAGE_PREFIX = 'xmsgi:message-draft:';

function getMessageDraftStorageKey(chatId: string) {
  return `${MESSAGE_DRAFT_STORAGE_PREFIX}${chatId}`;
}

function loadMessageDraft(chatId: string) {
  try {
    return window.localStorage.getItem(getMessageDraftStorageKey(chatId)) ?? '';
  } catch {
    return '';
  }
}

function persistMessageDraft(chatId: string, message: string) {
  const storageKey = getMessageDraftStorageKey(chatId);

  try {
    if (message) {
      window.localStorage.setItem(storageKey, message);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export function useMessageDraft(
  chatId: string | undefined,
  message: string,
  setMessage: Dispatch<SetStateAction<string>>,
) {
  const restoringDraftRef = useRef(false);
  const messageRef = useRef(message);
  const previousChatIdRef = useRef<string | null>(null);
  messageRef.current = message;

  useEffect(() => {
    const previousChatId = previousChatIdRef.current;
    if (previousChatId && previousChatId !== chatId) {
      persistMessageDraft(previousChatId, messageRef.current);
    }
    previousChatIdRef.current = chatId ?? null;

    restoringDraftRef.current = true;
    setMessage(chatId ? loadMessageDraft(chatId) : '');
  }, [chatId, setMessage]);

  useEffect(() => {
    if (restoringDraftRef.current) {
      restoringDraftRef.current = false;
      return;
    }

    if (!chatId) return;

    const timeoutId = window.setTimeout(
      () => persistMessageDraft(chatId, message),
      400,
    );

    return () => window.clearTimeout(timeoutId);
  }, [chatId, message]);
}