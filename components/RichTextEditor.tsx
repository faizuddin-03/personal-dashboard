"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Palette, Highlighter, RemoveFormatting, ChevronDown, CheckSquare,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo2, Redo2, Link as LinkIcon, Unlink,
  Code2, Table as TableIcon, ImagePlus,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  Minus, IndentIncrease, IndentDecrease,
} from "lucide-react";
import clsx from "clsx";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => (el as HTMLElement).style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) =>
        chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading", "blockquote"],
      attributes: {
        indent: {
          default: 0,
          parseHTML: el => {
            const ml = (el as HTMLElement).style.marginLeft;
            return ml ? parseInt(ml, 10) / 24 : 0;
          },
          renderHTML: attrs => {
            if (!attrs.indent || attrs.indent <= 0) return {};
            return { style: `margin-left: ${attrs.indent * 24}px` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.isBlock && node.attrs.indent !== undefined) {
            const newIndent = Math.min((node.attrs.indent || 0) + 1, 10);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent });
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.isBlock && node.attrs.indent !== undefined) {
            const newIndent = Math.max((node.attrs.indent || 0) - 1, 0);
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: newIndent });
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem") || this.editor.isActive("taskItem")) {
          return false;
        }
        return this.editor.commands.indent();
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem") || this.editor.isActive("taskItem")) {
          return false;
        }
        return this.editor.commands.outdent();
      },
    };
  },
});

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px", "64px"];

const FONTS = [
  { label: "Default",    value: "" },
  { label: "Sans-serif", value: "Arial, sans-serif" },
  { label: "Serif",      value: "Georgia, serif" },
  { label: "Mono",       value: "Courier New, monospace" },
  { label: "Inter",      value: "Inter, sans-serif" },
  { label: "Playfair",   value: "Playfair Display, serif" },
];

const TEXT_COLORS = [
  { name: "Default", color: null },
  { name: "Red",     color: "#f87171" },
  { name: "Orange",  color: "#fb923c" },
  { name: "Yellow",  color: "#fbbf24" },
  { name: "Green",   color: "#4ade80" },
  { name: "Blue",    color: "#60a5fa" },
  { name: "Purple",  color: "#c084fc" },
  { name: "Pink",    color: "#f472b6" },
  { name: "White",   color: "#f1f5f9" },
  { name: "Gray",    color: "#94a3b8" },
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
  const [showFonts, setShowFonts] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [sizeInput, setSizeInput] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Indent,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-400 underline cursor-pointer hover:text-blue-300" },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: { class: "max-w-full rounded-lg" },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { class: "focus:outline-none px-4 py-3 prose-invert max-w-none", style: `min-height:${minHeight}` },
    },
  });

  const closeDropdowns = useCallback(() => {
    setShowColors(false);
    setShowHighlights(false);
    setShowFonts(false);
    setShowSizes(false);
  }, []);

  if (!editor) return null;

  const activeFontAttrs = editor.getAttributes("textStyle");
  const activeFontFamily = (activeFontAttrs.fontFamily as string | null) ?? "";
  const activeFontLabel = FONTS.find(f => f.value && activeFontFamily.includes(f.value.split(",")[0].replace(/'/g, "")))?.label ?? "Font";
  const activeFontSize = (activeFontAttrs.fontSize as string | null) ?? "";

  function insertLink() {
    const prev = editor!.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  function insertImage() {
    const url = window.prompt("Enter image URL:");
    if (url) editor!.chain().focus().setImage({ src: url }).run();
  }

  function insertTable() {
    editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  return (
    <div className={clsx("border border-slate-700 rounded-xl bg-slate-800", className)} onClick={closeDropdowns}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-700 bg-slate-900 sticky top-0 z-20 rounded-t-xl">

        {/* Undo / Redo */}
        <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
          <Undo2 size={14} />
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
          <Redo2 size={14} />
        </TBtn>
        <Sep />

        {/* Font family */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={e => { e.stopPropagation(); closeDropdowns(); setShowFonts(v => !v); }}
            title="Font family"
            className={clsx(
              "flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors",
              showFonts ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            <span className="text-[11px] font-medium w-14 truncate text-left">{activeFontLabel}</span>
            <ChevronDown size={11} />
          </button>
          {showFonts && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 py-1 min-w-[150px]" onClick={e => e.stopPropagation()}>
              {FONTS.map(f => (
                <button
                  key={f.label}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    if (f.value) editor.chain().focus().setFontFamily(f.value).run();
                    else editor.chain().focus().unsetFontFamily().run();
                    setShowFonts(false);
                  }}
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-700",
                    activeFontLabel === f.label ? "text-blue-300" : "text-slate-300"
                  )}
                  style={{ fontFamily: f.value || "inherit" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size — typeable input + preset dropdown */}
        <div className="relative">
          <div className={clsx(
            "flex items-center rounded text-xs transition-colors",
            showSizes ? "bg-blue-600/20" : "hover:bg-slate-700"
          )}>
            <input
              type="text"
              inputMode="numeric"
              value={sizeInput !== "" ? sizeInput : (activeFontSize ? activeFontSize.replace("px", "") : "")}
              placeholder="Size"
              onFocus={() => setSizeInput(activeFontSize ? activeFontSize.replace("px", "") : "")}
              onChange={e => setSizeInput(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => {
                const n = parseInt(sizeInput, 10);
                if (n >= 6 && n <= 96) editor.chain().focus().setFontSize(`${n}px`).run();
                else if (sizeInput === "") editor.chain().focus().unsetFontSize().run();
                setSizeInput("");
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const n = parseInt(sizeInput, 10);
                  if (n >= 6 && n <= 96) editor.chain().focus().setFontSize(`${n}px`).run();
                  else if (sizeInput === "") editor.chain().focus().unsetFontSize().run();
                  setSizeInput("");
                  setShowSizes(false);
                  (e.target as HTMLInputElement).blur();
                }
                if (e.key === "Escape") { setSizeInput(""); setShowSizes(false); (e.target as HTMLInputElement).blur(); }
              }}
              className="w-8 bg-transparent text-center text-[11px] font-medium text-slate-400 focus:text-slate-200 focus:outline-none py-1.5 pl-1"
            />
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={e => { e.stopPropagation(); closeDropdowns(); setShowSizes(v => !v); }}
              className="pr-1.5 py-1.5 text-slate-400 hover:text-slate-200"
            >
              <ChevronDown size={11} />
            </button>
          </div>
          {showSizes && (
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 py-1 min-w-[80px] max-h-52 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { editor.chain().focus().unsetFontSize().run(); setShowSizes(false); }}
                className={clsx("w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-700", !activeFontSize ? "text-blue-300" : "text-slate-400")}
              >Default</button>
              {FONT_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { editor.chain().focus().setFontSize(size).run(); setShowSizes(false); }}
                  className={clsx("w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-700", activeFontSize === size ? "text-blue-300" : "text-slate-300")}
                >
                  {size.replace("px", "")}
                </button>
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Headings */}
        <TBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1"><Heading1 size={14} /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 size={14} /></TBtn>
        <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 size={14} /></TBtn>
        <Sep />

        {/* Marks */}
        <TBtn active={editor.isActive("bold")}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Bold (Ctrl+B)"><Bold size={14} /></TBtn>
        <TBtn active={editor.isActive("italic")}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Italic (Ctrl+I)"><Italic size={14} /></TBtn>
        <TBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)"><UnderlineIcon size={14} /></TBtn>
        <TBtn active={editor.isActive("strike")}    onClick={() => editor.chain().focus().toggleStrike().run()}    title="Strikethrough"><Strikethrough size={14} /></TBtn>
        <TBtn active={editor.isActive("subscript")}   onClick={() => editor.chain().focus().toggleSubscript().run()}   title="Subscript"><SubscriptIcon size={14} /></TBtn>
        <TBtn active={editor.isActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="Superscript"><SuperscriptIcon size={14} /></TBtn>
        <Sep />

        {/* Text color */}
        <div className="relative">
          <TBtn active={showColors} onClick={e => { e.stopPropagation(); closeDropdowns(); setShowColors(v => !v); }} title="Text color">
            <Palette size={14} />
          </TBtn>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 flex flex-wrap gap-1 w-40" onClick={e => e.stopPropagation()}>
              {TEXT_COLORS.map(c => (
                <button key={c.name} title={c.name}
                  onClick={() => { c.color ? editor.chain().focus().setColor(c.color).run() : editor.chain().focus().unsetColor().run(); setShowColors(false); }}
                  className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ background: c.color ?? "#475569" }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <TBtn active={showHighlights} onClick={e => { e.stopPropagation(); closeDropdowns(); setShowHighlights(v => !v); }} title="Highlight">
            <Highlighter size={14} />
          </TBtn>
          {showHighlights && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-30 flex flex-wrap gap-1 w-36" onClick={e => e.stopPropagation()}>
              {HIGHLIGHT_COLORS.map(c => (
                <button key={c.name} title={c.name}
                  onClick={() => { c.color ? editor.chain().focus().setHighlight({ color: c.color }).run() : editor.chain().focus().unsetHighlight().run(); setShowHighlights(false); }}
                  className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ background: c.color ?? "#1e293b" }}
                />
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Alignment */}
        <TBtn active={editor.isActive({ textAlign: "left" })}    onClick={() => editor.chain().focus().setTextAlign("left").run()}    title="Align left"><AlignLeft size={14} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: "center" })}  onClick={() => editor.chain().focus().setTextAlign("center").run()}  title="Align center"><AlignCenter size={14} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: "right" })}   onClick={() => editor.chain().focus().setTextAlign("right").run()}   title="Align right"><AlignRight size={14} /></TBtn>
        <TBtn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify"><AlignJustify size={14} /></TBtn>
        <Sep />

        {/* Lists */}
        <TBtn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet list"><List size={14} /></TBtn>
        <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={14} /></TBtn>
        <TBtn active={editor.isActive("taskList")}    onClick={() => editor.chain().focus().toggleTaskList().run()}    title="Checklist"><CheckSquare size={14} /></TBtn>
        <Sep />

        {/* Indent */}
        <TBtn onClick={() => editor.chain().focus().indent().run()} title="Indent (Tab)"><IndentIncrease size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().outdent().run()} title="Outdent (Shift+Tab)"><IndentDecrease size={14} /></TBtn>
        <Sep />

        {/* Block elements */}
        <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote"><Quote size={14} /></TBtn>
        <TBtn active={editor.isActive("codeBlock")}  onClick={() => editor.chain().focus().toggleCodeBlock().run()}  title="Code block"><Code2 size={14} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule"><Minus size={14} /></TBtn>
        <Sep />

        {/* Link */}
        <TBtn active={editor.isActive("link")} onClick={insertLink} title="Insert link (Ctrl+K)"><LinkIcon size={14} /></TBtn>
        {editor.isActive("link") && (
          <TBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link"><Unlink size={14} /></TBtn>
        )}

        {/* Image */}
        <TBtn onClick={insertImage} title="Insert image"><ImagePlus size={14} /></TBtn>

        {/* Table */}
        <TBtn onClick={insertTable} title="Insert table"><TableIcon size={14} /></TBtn>
        <Sep />

        {/* Clear formatting */}
        <TBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
          <RemoveFormatting size={14} />
        </TBtn>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Table floating controls */}
      {editor.isActive("table") && (
        <div className="flex items-center gap-1 px-2 py-1 border-t border-slate-700 bg-slate-900/80 text-xs">
          <span className="text-slate-500 mr-1">Table:</span>
          <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">+ Col</button>
          <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">+ Row</button>
          <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-0.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">- Col</button>
          <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-0.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">- Row</button>
          <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-0.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors">Delete table</button>
          <button type="button" onClick={() => editor.chain().focus().mergeCells().run()} className="px-2 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">Merge</button>
          <button type="button" onClick={() => editor.chain().focus().splitCell().run()} className="px-2 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors">Split</button>
        </div>
      )}
    </div>
  );
}

function TBtn({ active, onClick, title, disabled, children }: {
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={clsx(
        "p-1.5 rounded text-xs transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-4 bg-slate-700 mx-0.5" />;
}
