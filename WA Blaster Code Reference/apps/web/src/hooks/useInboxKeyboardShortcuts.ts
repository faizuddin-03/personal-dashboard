import { useEffect } from 'react';

export interface InboxKeyboardShortcutsOptions {
  enabled: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFocusComposer: () => void;
  onToggleResolve: () => void;
  onEscape: () => void;
}

/**
 * Wires inbox-wide keyboard shortcuts to the window:
 *   j / ArrowDown → next conversation
 *   k / ArrowUp   → previous conversation
 *   r            → focus composer
 *   e            → toggle resolve/reopen
 *   Escape       → deselect / blur composer
 *
 * Typing in inputs/textareas only forwards Escape; all other keys
 * are ignored so users can compose freely.
 */
export function useInboxKeyboardShortcuts(opts: InboxKeyboardShortcutsOptions) {
  const {
    enabled,
    onNext,
    onPrev,
    onFocusComposer,
    onToggleResolve,
    onEscape,
  } = opts;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't hijack modifier combos (Cmd/Ctrl+R, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'TEXTAREA' ||
        tag === 'INPUT' ||
        (target?.isContentEditable ?? false);

      if (isTyping) {
        if (e.key === 'Escape') {
          (target as HTMLElement | null)?.blur();
          onEscape();
        }
        return;
      }

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'r') {
        e.preventDefault();
        onFocusComposer();
      } else if (e.key === 'e') {
        e.preventDefault();
        onToggleResolve();
      } else if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onNext, onPrev, onFocusComposer, onToggleResolve, onEscape]);
}
