"use client";

/**
 * Executive Summary Editor
 * Rich text editor for per-channel executive summaries (admin-only editing)
 * Uses Tiptap for both editing and read-only rendering — no dangerouslySetInnerHTML needed.
 * @module components/dashboard/executive-summary-editor
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3,
  List, ListOrdered, TextQuote, Code,
  Undo2, Redo2, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const PRESET_COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#FFFFFF",
  "#DC2626", "#EA580C", "#D97706", "#65A30D", "#16A34A", "#0D9488",
  "#2563EB", "#7C3AED", "#DB2777", "#BE123C",
];

const CUSTOM_COLORS_KEY = "executive-summary-custom-colors";

function loadCustomColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustomColors(colors: string[]) {
  localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("#000000");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomColors(loadCustomColors());
  }, [open]);

  const applyColor = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const addCustomColor = () => {
    const color = inputValue;
    if (!color) return;
    const updated = [...customColors.filter((c) => c !== color), color].slice(-10);
    setCustomColors(updated);
    saveCustomColors(updated);
    applyColor(color);
  };

  const removeCustomColor = (color: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customColors.filter((c) => c !== color);
    setCustomColors(updated);
    saveCustomColors(updated);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Font color"
          className="flex cursor-pointer items-center rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <span className="flex h-4 w-4 flex-col items-center justify-center gap-0.5">
            <span className="text-xs font-bold leading-none" style={{ color: value }}>A</span>
            <span className="h-1 w-4 rounded-sm" style={{ backgroundColor: value }} />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Colors</p>
            <div className="grid grid-cols-8 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={() => applyColor(color)}
                  className={cn(
                    "h-5 w-5 rounded border border-border transition-transform hover:scale-110",
                    value === color && "ring-2 ring-primary ring-offset-1"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {customColors.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Saved</p>
              <div className="flex flex-wrap gap-1">
                {customColors.map((color) => (
                  <div key={color} className="group relative">
                    <button
                      type="button"
                      title={color}
                      onClick={() => applyColor(color)}
                      className={cn(
                        "h-5 w-5 rounded border border-border transition-transform hover:scale-110",
                        value === color && "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: color }}
                    />
                    <button
                      type="button"
                      onClick={(e) => removeCustomColor(color, e)}
                      className="absolute -right-1 -top-1 hidden h-3 w-3 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Custom</p>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="color"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="h-7 w-full cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
              </div>
              <button
                type="button"
                onClick={addCustomColor}
                title="Save color"
                className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const RICH_TEXT_CLASSES = [
  "max-w-none focus:outline-none",
  "[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-2 [&_h3]:mb-0.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_s]:line-through [&_del]:line-through",
  "[&_p]:my-1",
  "[&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:space-y-0.5",
  "[&_ol]:my-1 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-0.5",
  "[&_li]:leading-relaxed",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic",
  "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded",
  "[&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_hr]:my-3 [&_hr]:border-border",
].join(" ");

interface ExecutiveSummaryEditorProps {
  initialContent: string;
  channel: string;
  month: string;
  canEdit: boolean;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function ExecutiveSummaryEditor({
  initialContent,
  channel,
  month,
  canEdit,
}: ExecutiveSummaryEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedContent, setSavedContent] = useState(initialContent);

  // Single Tiptap editor instance used for both view and edit modes.
  // editable=false for view; editable=true when admin activates editing.
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: "Add an executive summary for this channel…",
      }),
    ],
    content: savedContent,
    editable: false,
    editorProps: {
      attributes: {
        class: cn("min-h-[80px]", RICH_TEXT_CLASSES),
      },
    },
  });

  // Re-fetch content when month changes (client-side navigation)
  useEffect(() => {
    let cancelled = false;
    async function fetchContent() {
      try {
        const res = await fetch(`${BASE_PATH}/api/executive-summary?channel=${encodeURIComponent(channel)}&month=${encodeURIComponent(month)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as { content: string };
        if (cancelled) return;
        setSavedContent(data.content);
        editor?.commands.setContent(data.content);
        editor?.setEditable(false);
        setIsEditing(false);
      } catch {
        // Ignore fetch errors on month switch
      }
    }
    fetchContent();
    return () => { cancelled = true; };
  }, [month, channel, editor]);

  const handleStartEdit = useCallback(() => {
    if (!canEdit) return;
    editor?.setEditable(true);
    editor?.commands.focus("end");
    setIsEditing(true);
  }, [canEdit, editor]);

  const handleCancel = useCallback(() => {
    editor?.commands.setContent(savedContent);
    editor?.setEditable(false);
    setIsEditing(false);
  }, [editor, savedContent]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    const content = editor.getHTML();
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/executive-summary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, month, content }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedContent(content);
      editor.setEditable(false);
      setIsEditing(false);
    } catch {
      // Keep editing mode open so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [editor, channel, month]);

  // Non-admin with no content: render nothing
  if (!canEdit && !savedContent) {
    return null;
  }

  // Non-admin: read-only Tiptap render (no dangerouslySetInnerHTML)
  if (!canEdit) {
    return (
      <div className="text-foreground">
        <EditorContent editor={editor} />
      </div>
    );
  }

  // Admin view
  return (
    <div className="rounded-lg border bg-card p-4">
      {isEditing && (
        <div className="mb-2 flex flex-wrap items-center gap-0.5 border-b pb-2">
          <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive("heading", { level: 3 })} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Bullet list">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Ordered list">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Blockquote">
            <TextQuote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive("code")} title="Inline code">
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" />
          <ColorPicker
            value={editor?.getAttributes("textStyle").color ?? "#000000"}
            onChange={(color) => editor?.chain().focus().setColor(color).run()}
          />
        </div>
      )}

      <div
        onClick={!isEditing ? handleStartEdit : undefined}
        className={cn(!isEditing && "cursor-text")}
      >
        <EditorContent editor={editor} />
      </div>

      {!isEditing && (
        <p className="mt-1 text-xs text-muted-foreground">Click to edit executive summary</p>
      )}

      {isEditing && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
