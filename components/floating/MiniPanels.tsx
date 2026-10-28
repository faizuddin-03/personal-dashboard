"use client";
import dynamic from "next/dynamic";
import s from "./floating.module.css";

function Loading() {
  return <div className={s.placeholder}>Loading…</div>;
}

/** Notes window — the compact notes view owned by the Notes page. */
export const NotesPanel = dynamic(() => import("@/components/notes/NotesMini"), { ssr: false, loading: Loading });

/** To-do window — the compact list owned by the To-do page. */
export const TodoPanel = dynamic(() => import("@/components/todo/TodoMini"), { ssr: false, loading: Loading });
