"use client";
import { useState, type InputHTMLAttributes } from "react";

/**
 * A number field that behaves like plain text — standing rule for every
 * dashboard number field (Faizuddin, 2026-10-15): "make the format simple
 * text but accept numbers only. because for the current one, if i click
 * backspace, it will automatically display 1 instead of clearing it."
 *
 * - `type="text"` + `inputMode="numeric"`: no spinner, no browser number
 *   quirks, numeric keypad on phones.
 * - Only digits are kept as you type; anything else is dropped.
 * - The field may be EMPTY while editing — backspace clears it, so typing
 *   420 gives 420, not 1420.
 * - min / max / fallback are applied only when the field loses focus (or
 *   Enter is pressed), never on each keystroke.
 *
 * The parent holds a number; this component keeps its own text draft.
 */
export default function NumericTextInput({
  value, onChange, min, max, fallback, className, ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  /** Used when the field is left empty. Defaults to `min ?? 0`. */
  fallback?: number;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max">) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit(text: string) {
    let n = text === "" ? (fallback ?? min ?? 0) : parseInt(text, 10);
    if (!Number.isFinite(n)) n = fallback ?? min ?? 0;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    setDraft(null);
    onChange(n);
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={draft ?? String(value)}
      onChange={e => setDraft(e.target.value.replace(/\D+/g, ""))}
      onBlur={e => { if (draft !== null) commit(draft); rest.onBlur?.(e); }}
      onKeyDown={e => { if (e.key === "Enter" && draft !== null) commit(draft); rest.onKeyDown?.(e); }}
      className={className}
    />
  );
}
