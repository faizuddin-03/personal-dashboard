"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Palette, Highlighter, RemoveFormatting,
} from "lucide-react";
import clsx from "clsx";

const TEXT_COLORS = [
  { name: "Default", color: null },
  { name: "Red",     color: "#f87171" },
  { name: "Orange",  color: "#fb923c" },
  { name: "Yellow",  color: "#fbbf24" },
  { name: "Green",   color: "#4ade80" },
  { name: "Blue",    color: "#60a5fa" },
  { name: "Purple",  color: "#c084fc" },
  { name: "Pink",    color: "#f472b6" },
];

const HIGHLIGHT_COLORS = [
  { name: "None",   color: null },
  { name: "Red",    color: "#7f1d1d" },
  { name: "Amber",  color: "#78350f" },
  { name: "Yellow", color: "#713f12" },
  { name: "Green",  color: "#14532d" },
  { name: "Blue",   color: "#1e3a8a" },
  { name: "Purple", color: "#4c1d95" },
];

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

export default function RichTextEditor({
  content, onChange, placeholder = "Start writing…", minHeight = "180px", className,
}: Props) {
  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "focus:outline-none px-4 py-3", style: `min-height:${minHeight}` },
    },
  });

  const closeDropdowns = useCallback(() => {
    setShowColors(false);
    setShowHighlights(false);
  }, []);

  if (!editor) return null;

  return (
    <div className={clsx("border border-slate-700 rounded-xl overflow-hidden bg-slate-800", className)} onClick={closeDropdowns}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-700 bg-slate-900/60">
        {/* Headings */}
        <TBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={14} /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={14} /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={14} /></TBtn>
        <Sep />
        {/* Marks */}
        <TBtn active={editor.isActive("bold")}          onClick={() => editor.chain().focus().toggleBold().run()}          title="Bold"><Bold size={14} /></TBtn>
        <TBtn active={editor.isActive("italic")}        onClick={() => editor.chain().focus().toggleItalic().run()}        title="Italic"><Italic size={14} /></TBtn>
        <TBtn active={editor.isActive("underline")}     onClick={() => editor.chain().focus().toggleUnderline().run()}     title="Underline"><UnderlineIcon size={14} /></TBtn>
        <TBtn active={editor.isActive("strike")}        onClick={() => editor.chain().focus().toggleStrike().run()}        title="Strikethrough"><Strikethrough size={14} /></TBtn>
        <Sep />
        {/* Lists */}
        <TBtn active={editor.isActive("bulletList")}    onClick={() => editor.chain().focus().toggleBulletList().run()}    title="Bullet list"><List size={14} /></TBtn>
        <TBtn active={editor.isActive("orderedList")}   onClick={() => editor.chain().focus().toggleOrderedList().run()}   title="Numbered list"><ListOrdered size={14} /></TBtn>
        <TBtn active={editor.isActive("blockquote")}    onClick={() => editor.chain().focus().toggleBlockquote().run()}    title="Quote"><Quote size={14} /></TBtn>
        <Sep />
        {/* Text color */}
        <div className="relative">
          <TBtn
            active={showColors}
            onClick={(e) => { e.stopPropagation(); setShowColors(v => !v); setShowHighlights(false); }}
            title="Text color"
          >
            <Palette size={14} />
          </TBtn>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 flex flex-wrap gap-1 w-36" onClick={e => e.stopPropagation()}>
              {TEXT_COLORS.map(c => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => {
                    if (c.color) editor.chain().focus().setColor(c.color).run();
                    else editor.chain().focus().unsetColor().run();
                    setShowColors(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ background: c.color ?? "#475569" }}
                />
              ))}
            </div>
          )}
        </div>
        {/* Highlight */}
        <div className="relative">
          <TBtn
            active={showHighlights}
            onClick={(e) => { e.stopPropagation(); setShowHighlights(v => !v); setShowColors(false); }}
            title="Highlight"
          >
            <Highlighter size={14} />
          </TBtn>
          {showHighlights && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 flex flex-wrap gap-1 w-36" onClick={e => e.stopPropagation()}>
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.name}
                  title={c.name}
                  onClick={() => {
                    if (c.color) editor.chain().focus().setHighlight({ color: c.color }).run();
                    else editor.chain().focus().unsetHighlight().run();
                    setShowHighlights(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ background: c.color ?? "#1e293b" }}
                />
              ))}
            </div>
          )}
        </div>
        <Sep />
        {/* Clear formatting */}
        <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting size={14} />
        </TBtn>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

function TBtn({ active, onClick, title, children }: {
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={clsx(
        "p-1.5 rounded text-xs transition-colors",
        active ? "bg-blue-600/40 text-blue-300" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-4 bg-slate-700 mx-0.5" />;
}
