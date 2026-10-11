import type { Chat, ScheduledMessage, Template } from '@/types';

export type MessageHistoryScope = 'personal' | 'workspace';

const UPCOMING_KEYS: Record<MessageHistoryScope, { current: string; legacy: string }> = {
  personal: { current: 'xmsgi_upcoming', legacy: 'awaitmsg_upcoming' },
  workspace: { current: 'xmsgi_workspace_upcoming', legacy: 'awaitmsg_workspace_upcoming' },
};
const SENT_KEYS: Record<MessageHistoryScope, { current: string; legacy: string }> = {
  personal: { current: 'xmsgi_sent', legacy: 'awaitmsg_sent' },
  workspace: { current: 'xmsgi_workspace_sent', legacy: 'awaitmsg_workspace_sent' },
};
const HIDDEN_CHATS_KEY = 'xmsgi_hidden_chats_v2';
const LEGACY_HIDDEN_CHATS_KEY = 'awaitmsg_hidden_chats_v2';
const CHATS_KEY = 'xmsgi_chats';
const LEGACY_CHATS_KEY = 'awaitmsg_chats';
const CHAT_PERMISSIONS_KEY = 'xmsgi_chat_permissions';
const LEGACY_CHAT_PERMISSIONS_KEY = 'awaitmsg_chat_permissions';
const TEMPLATES_KEY = 'xmsgi_templates';
const LEGACY_TEMPLATES_KEY = 'awaitmsg_templates';
let persistentChatWriteQueue = Promise.resolve();

function readStoredValue<T>(key: string, legacyKey: string | null, fallback: T): T {
  const preferred = localStorage.getItem(key);
  if (preferred !== null) {
    try {
      return JSON.parse(preferred) as T;
    } catch {
      return fallback;
    }
  }

  if (legacyKey && localStorage.getItem(legacyKey) !== null) {
    try {
      const migrated = JSON.parse(localStorage.getItem(legacyKey)!) as T;
      localStorage.setItem(key, JSON.stringify(migrated));
      return migrated;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function persistStoredValue<T>(key: string, legacyKey: string | null, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    if (legacyKey && legacyKey !== key) {
      localStorage.setItem(legacyKey, JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function loadUpcoming(scope: MessageHistoryScope = 'personal'): ScheduledMessage[] {
  return readStoredValue<ScheduledMessage[]>(UPCOMING_KEYS[scope].current, UPCOMING_KEYS[scope].legacy, []);
}

export function loadSent(scope: MessageHistoryScope = 'personal'): ScheduledMessage[] {
  return readStoredValue<ScheduledMessage[]>(SENT_KEYS[scope].current, SENT_KEYS[scope].legacy, []);
}

export function saveUpcoming(messages: ScheduledMessage[], scope: MessageHistoryScope = 'personal'): void {
  persistStoredValue(UPCOMING_KEYS[scope].current, UPCOMING_KEYS[scope].legacy, messages);
}

export function saveSent(messages: ScheduledMessage[], scope: MessageHistoryScope = 'personal'): void {
  persistStoredValue(SENT_KEYS[scope].current, SENT_KEYS[scope].legacy, messages);
}

export function loadHiddenChats(): string[] {
  return readStoredValue<string[]>(HIDDEN_CHATS_KEY, LEGACY_HIDDEN_CHATS_KEY, []);
}

export function saveHiddenChats(chats: string[]): void {
  persistStoredValue(HIDDEN_CHATS_KEY, LEGACY_HIDDEN_CHATS_KEY, chats);
}

export function loadChats(): { id: string; name: string }[] {
  return readStoredValue<{ id: string; name: string }[]>(CHATS_KEY, LEGACY_CHATS_KEY, []);
}

export function saveChats(chats: { id: string; name: string }[]): void {
  persistStoredValue(CHATS_KEY, LEGACY_CHATS_KEY, chats);
}

export async function loadPersistentChats(): Promise<Chat[]> {
  if (typeof window !== 'undefined' && typeof window.telegram?.loadSavedChats === 'function') {
    const persistedChats = await window.telegram.loadSavedChats();
    if (persistedChats.length > 0) return persistedChats;

    const legacyChats = loadChats() as Chat[];
    if (legacyChats.length > 0 && typeof window.telegram.saveSavedChats === 'function') {
      await savePersistentChats(legacyChats);
    }

    return legacyChats;
  }

  return loadChats() as Chat[];
}

export function loadChatPermissions(): Record<string, { canView: boolean; canSend: boolean | null; canSchedule: boolean | null; error?: string }> {
  return readStoredValue<Record<string, { canView: boolean; canSend: boolean | null; canSchedule: boolean | null; error?: string }>>(CHAT_PERMISSIONS_KEY, LEGACY_CHAT_PERMISSIONS_KEY, {});
}

export function saveChatPermissions(permissions: Record<string, { canView: boolean; canSend: boolean | null; canSchedule: boolean | null; error?: string }>): void {
  persistStoredValue(CHAT_PERMISSIONS_KEY, LEGACY_CHAT_PERMISSIONS_KEY, permissions);
}

export async function savePersistentChats(chats: Chat[]): Promise<void> {
  const write = async () => {
    persistStoredValue(CHATS_KEY, LEGACY_CHATS_KEY, chats);

    if (typeof window !== 'undefined' && typeof window.telegram?.saveSavedChats === 'function') {
      await window.telegram.saveSavedChats(chats);
    }
  };

  const queuedWrite = persistentChatWriteQueue.then(write, write);
  persistentChatWriteQueue = queuedWrite.catch(() => undefined);
  return queuedWrite;
}

function isTemplate(value: unknown): value is Template {
  if (!value || typeof value !== 'object') return false;

  const template = value as Partial<Template>;

  return (
    typeof template.id === 'string' &&
    typeof template.name === 'string' &&
    typeof template.body === 'string' &&
    typeof template.createdAt === 'string' &&
    typeof template.updatedAt === 'string'
  );
}

export function loadTemplates(): Template[] {
  const stored = readStoredValue<unknown>(TEMPLATES_KEY, LEGACY_TEMPLATES_KEY, []);

  if (!Array.isArray(stored)) return [];

  return stored.filter(isTemplate);
}

export function saveTemplates(templates: Template[]): void {
  persistStoredValue(TEMPLATES_KEY, LEGACY_TEMPLATES_KEY, templates);
}
