import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { NAV_CHORDS, isTyping } from '../lib/shortcuts';

/** Vim-style "g then key" navigation chords. Mount once at the shell level. */
export function useGlobalNavShortcuts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      if (!pendingRef.current) {
        if (key === 'g') {
          pendingRef.current = true;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => { pendingRef.current = false; }, 800);
        }
        return;
      }
      pendingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      const chord = NAV_CHORDS.find((c) => c.keys === `g ${key}`);
      if (chord && (!chord.adminOnly || user?.role === 'ADMIN')) {
        e.preventDefault();
        navigate(chord.path);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, user]);
}
