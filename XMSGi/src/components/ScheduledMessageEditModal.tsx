import { useState, type FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import type { ScheduledMessage } from '@/types';
import { useLocale } from '@/lib/i18n';
import { getMessageMaxLength } from '@/lib/messageLimits';
import './ScheduledMessageEditModal.css';

type EditValues = {
  message: string;
  date: string;
  time: string;
};

type Props = {
  message: ScheduledMessage;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (edit: EditValues) => Promise<boolean>;
};

function getLocalDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  };
}

export function ScheduledMessageEditModal({ message, isSaving, onCancel, onSave }: Props) {
  const { t } = useLocale();
  const initialDateTime = getLocalDateTime(message.when);
  const maxLength = getMessageMaxLength(Boolean(message.attachments?.length));
  const [text, setText] = useState(message.text);
  const [date, setDate] = useState(initialDateTime.date);
  const [time, setTime] = useState(initialDateTime.time);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const saved = await onSave({ message: text, date, time });
    if (saved) onCancel();
  }

  return (
    <div
      className="scheduled-edit-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isSaving) onCancel();
      }}
    >
      <form
        className="scheduled-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheduled-edit-title"
        onSubmit={handleSubmit}
      >
        <header className="scheduled-edit-header">
          <h2 id="scheduled-edit-title">{t('schedule.editDialogTitle')}</h2>
          <button
            type="button"
            className="scheduled-edit-close"
            aria-label={t('schedule.editCancel')}
            title={t('schedule.editCancel')}
            disabled={isSaving}
            onClick={onCancel}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <label className="scheduled-edit-field">
          <span>{t('schedule.editMessageLabel')}</span>
          <textarea
            value={text}
            maxLength={maxLength}
            required
            autoFocus
            disabled={isSaving}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        <div className="scheduled-edit-datetime">
          <label className="scheduled-edit-field">
            <span>{t('schedule.editDateLabel')}</span>
            <input
              type="date"
              value={date}
              required
              disabled={isSaving}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="scheduled-edit-field">
            <span>{t('schedule.editTimeLabel')}</span>
            <input
              type="time"
              value={time}
              required
              disabled={isSaving}
              onChange={(event) => setTime(event.target.value)}
            />
          </label>
        </div>

        <p className="scheduled-edit-note">{t('schedule.editNote')}</p>

        <footer className="scheduled-edit-actions">
          <button type="button" className="scheduled-edit-cancel" disabled={isSaving} onClick={onCancel}>
            {t('schedule.editCancel')}
          </button>
          <button type="submit" className="scheduled-edit-save" disabled={isSaving || !text.trim()}>
            <Save size={15} aria-hidden="true" />
            {isSaving ? t('schedule.editSaving') : t('schedule.editSave')}
          </button>
        </footer>
      </form>
    </div>
  );
}