/**
 * Insights Client Component
 * Insights management with drag-and-drop reordering
 * @module components/insights/insights-client
 */

"use client";

import * as React from "react";
import { Insight } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Placeholder from "@tiptap/extension-placeholder";
import { Sparkles, Trash2, ChevronDown, Plus, Pencil, Check, X, Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered, TextQuote, Code, Undo2, Redo2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Markdown } from "tiptap-markdown";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Shared rich-text element styles for Tiptap editors/viewers.
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

interface InsightsClientProps {
  initialInsights: Insight[];
  canManageInsights: boolean;
}

const CHANNELS = [
  { value: "all", label: "All Channels" },
  { value: "email", label: "Email" },
  { value: "web", label: "Web" },
  { value: "social", label: "Social" },
] as const;

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  web: "bg-green-100 text-green-800",
  social: "bg-purple-100 text-purple-800",
};

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Get targetMonth from prompt_context; fall back to month derived from created_at */
function getTargetMonth(insight: Insight): string {
  const tm = (insight.prompt_context as Record<string, unknown>)?.targetMonth;
  if (typeof tm === "string" && tm.trim()) return tm;
  return getMonthKey(insight.created_at);
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Get groupId from prompt_context; fall back to month key for legacy insights */
function getGroupKey(insight: Insight): string {
  const gid = (insight.prompt_context as Record<string, unknown>)?.groupId;
  if (typeof gid === "string") return gid;
  return getMonthKey(insight.created_at);
}

function groupByGroupKey(insights: Insight[]): Map<string, Insight[]> {
  const groups = new Map<string, Insight[]>();
  for (const insight of insights) {
    const key = getGroupKey(insight);
    const existing = groups.get(key) || [];
    existing.push(insight);
    groups.set(key, existing);
  }
  return groups;
}

/** Get the default label for a group (derived from the first insight's target month) */
function getDefaultGroupLabel(groupInsights: Insight[]): string {
  if (groupInsights.length === 0) return "Untitled";
  return formatMonthLabel(getTargetMonth(groupInsights[0]));
}

/** Get sort order from the first insight's prompt_context in a group */
function getSortOrder(allInsights: Insight[], groupKey: string): number | null {
  for (const insight of allInsights) {
    if (getGroupKey(insight) === groupKey) {
      const order = (insight.prompt_context as Record<string, unknown>)?.sortOrder;
      if (typeof order === "number") return order;
    }
  }
  return null;
}

/** Sort group keys: by persisted sortOrder first, then creation date descending */
function sortGroupKeys(keys: string[], allInsights: Insight[]): string[] {
  return [...keys].sort((a, b) => {
    const orderA = getSortOrder(allInsights, a);
    const orderB = getSortOrder(allInsights, b);
    if (orderA !== null && orderB !== null) return orderA - orderB;
    if (orderA !== null) return -1;
    if (orderB !== null) return 1;
    // For groups without explicit order, sort by first insight's created_at descending
    const aInsight = allInsights.find((i) => getGroupKey(i) === a);
    const bInsight = allInsights.find((i) => getGroupKey(i) === b);
    const aDate = aInsight ? new Date(aInsight.created_at).getTime() : 0;
    const bDate = bInsight ? new Date(bInsight.created_at).getTime() : 0;
    return bDate - aDate;
  });
}

/** Look across ALL insights in a group for a custom monthLabel stored in prompt_context */
function getCustomGroupLabel(allInsights: Insight[], groupKey: string): string | null {
  for (const insight of allInsights) {
    if (getGroupKey(insight) === groupKey) {
      const label = (insight.prompt_context as Record<string, unknown>)?.monthLabel;
      if (typeof label === "string" && label.trim()) return label;
    }
  }
  return null;
}

function useEditableMonthLabel({
  monthKey,
  allInsights,
  onSaveLabel,
}: {
  monthKey: string;
  allInsights: Insight[];
  onSaveLabel: (monthKey: string, label: string, targetMonth?: string) => Promise<void>;
}) {
  const customLabel = getCustomGroupLabel(allInsights, monthKey);
  const currentTargetMonth = React.useMemo(() => {
    const groupInsight = allInsights.find((i) => getGroupKey(i) === monthKey);
    return groupInsight ? getTargetMonth(groupInsight) : undefined;
  }, [allInsights, monthKey]);
  const defaultLabel = React.useMemo(() => {
    return currentTargetMonth ? formatMonthLabel(currentTargetMonth) : monthKey;
  }, [currentTargetMonth, monthKey]);
  const displayLabel = customLabel ?? defaultLabel;
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(displayLabel);
  const [monthValue, setMonthValue] = React.useState(currentTargetMonth);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setValue(customLabel ?? defaultLabel);
  }, [customLabel, defaultLabel]);

  React.useEffect(() => {
    setMonthValue(currentTargetMonth);
  }, [currentTargetMonth]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveLabel(monthKey, value.trim(), monthValue);
      setIsEditing(false);
    } catch {
      // keep editing
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(displayLabel);
    setMonthValue(currentTargetMonth);
    setIsEditing(false);
  };

  return { displayLabel, isEditing, setIsEditing, value, setValue, monthValue, setMonthValue, isSaving, handleSave, handleCancel };
}

// ─── Sortable Month Accordion ────────────────────────────────────────────────

function SortableMonthAccordion({
  monthKey,
  monthInsights,
  allInsights,
  isOpen,
  onToggle,
  canManage,
  activeTab,
  onSaveLabel,
  onSave,
  onDelete,
  onDeleteMonth,
  onRestoreChannel,
}: {
  monthKey: string;
  monthInsights: Insight[];
  allInsights: Insight[];
  isOpen: boolean;
  onToggle: () => void;
  canManage: boolean;
  activeTab: string;
  onSaveLabel: (monthKey: string, label: string, targetMonth?: string) => Promise<void>;
  onSave: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteMonth: (monthKey: string) => void;
  onRestoreChannel: (groupKey: string, channel: string | null) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: monthKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  const tabInsights = activeTab === "all"
    ? monthInsights.filter((i) => i.channel === null)
    : monthInsights.filter((i) => i.channel === activeTab);

  const labelState = useEditableMonthLabel({ monthKey, allInsights, onSaveLabel });
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (labelState.isEditing) inputRef.current?.focus();
  }, [labelState.isEditing]);

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-muted/40 px-4 py-2">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        {labelState.isEditing ? (
          <div className="flex items-center gap-1.5 py-2" onClick={(e) => e.stopPropagation()}>
            <MonthPicker value={labelState.monthValue} onChange={labelState.setMonthValue} className="h-7 w-[120px] text-xs" />
            <input
              ref={inputRef}
              value={labelState.value}
              onChange={(e) => labelState.setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") labelState.handleSave(); if (e.key === "Escape") labelState.handleCancel(); }}
              className="flex-1 bg-transparent border-b border-foreground/30 text-sm font-medium outline-none px-0 py-0"
              disabled={labelState.isSaving}
            />
            <span role="button" tabIndex={0} onClick={labelState.handleSave} onKeyDown={(e) => { if (e.key === "Enter") labelState.handleSave(); }} className={cn("p-0.5 rounded hover:bg-accent cursor-pointer", labelState.isSaving && "pointer-events-none opacity-50")}>
              <Check className="h-3 w-3 text-green-600" />
            </span>
            <span role="button" tabIndex={0} onClick={labelState.handleCancel} onKeyDown={(e) => { if (e.key === "Escape") labelState.handleCancel(); }} className="p-0.5 rounded hover:bg-accent cursor-pointer">
              <X className="h-3 w-3 text-destructive" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 py-2">
            {canManage && (
              <span
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent text-muted-foreground"
              >
                <GripVertical className="h-4 w-4" />
              </span>
            )}
            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
              <span className={cn("inline-flex items-center gap-1.5 group")}>
                {labelState.displayLabel}
                {canManage && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); labelState.setIsEditing(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); labelState.setIsEditing(true); } }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                  </span>
                )}
              </span>
            </CollapsibleTrigger>
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
                onClick={(e) => { e.stopPropagation(); onDeleteMonth(monthKey); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete {getCustomGroupLabel(allInsights, monthKey) ?? getDefaultGroupLabel(monthInsights)}
              </Button>
            )}
          </div>
        )}
        <CollapsibleContent className="space-y-4 mt-2 pb-2">
          {tabInsights.length > 0 ? (
            tabInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                canEdit={canManage}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))
          ) : canManage ? (
            <button
              type="button"
              className="text-sm text-muted-foreground italic py-2 hover:text-foreground transition-colors cursor-pointer underline decoration-dashed underline-offset-2"
              onClick={() => onRestoreChannel(monthKey, activeTab === "all" ? null : activeTab)}
            >
              Click to add {activeTab === "all" ? "Cross-Channel" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} analysis
            </button>
          ) : (
            <p className="text-sm text-muted-foreground italic py-2">
              No content for this channel yet.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Main InsightsClient ─────────────────────────────────────────────────────

export function InsightsClient({ initialInsights, canManageInsights }: InsightsClientProps) {
  const [insights, setInsights] = React.useState<Insight[]>(initialInsights);
  const [activeTab, setActiveTab] = React.useState("all");
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newMonth, setNewMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isCreating, setIsCreating] = React.useState(false);
  const [openMonths, setOpenMonths] = React.useState<Set<string>>(() => new Set());
  const [monthOrder, setMonthOrder] = React.useState<string[]>([]);
  const [deleteMonthTarget, setDeleteMonthTarget] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const initializedRef = React.useRef(false);

  // Month groups from ALL insights so accordions persist across tab switches
  const allGroupMap = groupByGroupKey(insights);

  // Keep monthOrder in sync when insights change
  React.useEffect(() => {
    const currentKeys = Array.from(allGroupMap.keys());
    setMonthOrder((prev) => {
      // Keep existing order for known keys, append new keys sorted
      const known = prev.filter((k) => currentKeys.includes(k));
      const newKeys = currentKeys.filter((k) => !prev.includes(k));
      const sortedNew = sortGroupKeys(newKeys, insights);
      if (known.length === 0 && sortedNew.length > 0) {
        // First load: use persisted sort order
        return sortGroupKeys(currentKeys, insights);
      }
      return [...known, ...sortedNew];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights]);

  // Auto-open the first month on initial load
  React.useEffect(() => {
    if (!initializedRef.current && monthOrder.length > 0) {
      setOpenMonths(new Set([monthOrder[0]]));
      initializedRef.current = true;
    }
  }, [monthOrder]);

  const toggleMonth = (monthKey: string) => {
    setOpenMonths((prev) =>
      prev.has(monthKey) ? new Set() : new Set([monthKey])
    );
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const persistSortOrder = React.useCallback(async (order: string[]) => {
    const orders: { id: string; sortOrder: number }[] = [];
    for (let i = 0; i < order.length; i++) {
      const target = insights.find((ins) => getGroupKey(ins) === order[i]);
      if (target) {
        orders.push({ id: target.id, sortOrder: i });
      }
    }
    try {
      await fetch(`${BASE_PATH}/api/insights/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });
    } catch (err) {
      console.error("Failed to persist sort order:", err);
    }
  }, [insights]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMonthOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      persistSortOrder(newOrder);
      return newOrder;
    });
  }, [persistSortOrder]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), month: newMonth }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInsights((prev) => [...data.insights, ...prev]);
      // Prepend new group to order
      const newGroupId = (data.insights[0]?.prompt_context as Record<string, unknown>)?.groupId as string;
      if (newGroupId) {
        setMonthOrder((prev) => [newGroupId, ...prev]);
        setOpenMonths(new Set([newGroupId]));
      }
      setShowNewForm(false);
      setNewTitle("");
    } catch (err) {
      console.error("Failed to create insight:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async (id: string, title: string, content: string) => {
    const res = await fetch(`${BASE_PATH}/api/insights/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setInsights((prev) => prev.map((i) => (i.id === id ? data.insight : i)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this insight?")) return;
    const res = await fetch(`${BASE_PATH}/api/insights/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDeleteMonth = async () => {
    if (!deleteMonthTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/insights`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: deleteMonthTarget }),
      });
      if (!res.ok) throw new Error("Failed to delete group");
      setInsights((prev) => prev.filter((i) => getGroupKey(i) !== deleteMonthTarget));
      setMonthOrder((prev) => prev.filter((k) => k !== deleteMonthTarget));
      setDeleteMonthTarget(null);
    } catch (err) {
      console.error("Failed to delete month:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMonthLabel = async (monthKey: string, label: string, targetMonth?: string) => {
    const target = insights.find((i) => getGroupKey(i) === monthKey);
    if (!target) return;
    const promptContext = {
      ...(target.prompt_context as Record<string, unknown>),
      monthLabel: label,
      ...(targetMonth && { targetMonth }),
    };
    const res = await fetch(`${BASE_PATH}/api/insights/${target.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptContext }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setInsights((prev) => prev.map((i) => (i.id === target.id ? data.insight : i)));
  };

  const handleRestoreChannel = async (groupKey: string, channel: string | null) => {
    const groupInsights = insights.filter((i) => getGroupKey(i) === groupKey);
    if (groupInsights.length === 0) return;
    const sample = groupInsights[0];
    const pc = sample.prompt_context as Record<string, unknown>;
    const groupId = pc?.groupId as string | undefined;
    const monthLabel = pc?.monthLabel as string | undefined;
    const monthKey = getTargetMonth(sample);

    const res = await fetch(`${BASE_PATH}/api/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: groupId ?? groupKey,
        channel,
        title: monthLabel,
        month: monthKey,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setInsights((prev) => [...prev, data.insight]);
  };

  const deleteLabel = deleteMonthTarget
    ? (() => { const lbl = getCustomGroupLabel(insights, deleteMonthTarget!); if (lbl) return lbl; const gi = insights.find(i => getGroupKey(i) === deleteMonthTarget); return gi ? formatMonthLabel(getTargetMonth(gi)) : deleteMonthTarget!; })()
    : "";

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            {CHANNELS.map((ch) => (
              <TabsTrigger key={ch.value} value={ch.value}>
                {ch.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {canManageInsights && !showNewForm && (
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Insight
            </Button>
          )}
        </div>

        {showNewForm && (
          <div className="flex items-center gap-3 mt-4">
            <MonthPicker
              value={newMonth}
              onChange={setNewMonth}
            />
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Insight title"
              className="flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
            <Button size="sm" onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowNewForm(false); setNewTitle(""); }}>
              Cancel
            </Button>
          </div>
        )}

        {/* Hidden TabsContent elements to satisfy Radix Tabs */}
        {CHANNELS.map((ch) => (
          <TabsContent key={ch.value} value={ch.value} className="mt-0" />
        ))}
      </Tabs>

      {/* Accordions rendered OUTSIDE tabs so they persist across tab switches */}
      <div className="space-y-4">
        {monthOrder.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No insights yet</p>
            <p className="text-sm mt-1">Create your first insight using the button above.</p>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={monthOrder} strategy={verticalListSortingStrategy}>
              {monthOrder.map((monthKey) => {
                const monthInsights = allGroupMap.get(monthKey);
                if (!monthInsights) return null;
                return (
                  <SortableMonthAccordion
                    key={monthKey}
                    monthKey={monthKey}
                    monthInsights={monthInsights}
                    allInsights={insights}
                    isOpen={openMonths.has(monthKey)}
                    onToggle={() => toggleMonth(monthKey)}
                    canManage={canManageInsights}
                    activeTab={activeTab}
                    onSaveLabel={handleSaveMonthLabel}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onDeleteMonth={setDeleteMonthTarget}
                    onRestoreChannel={handleRestoreChannel}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Delete month confirmation dialog */}
      <Dialog open={!!deleteMonthTarget} onOpenChange={(open) => { if (!open) setDeleteMonthTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteLabel}?</DialogTitle>
            <DialogDescription>
              This will permanently delete all insights for this month across all channels. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMonthTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMonth} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InsightContentViewer({ content }: { content: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [StarterKit, TextStyle, Color, Markdown],
    content,
    editorProps: {
      attributes: {
        class: cn("text-sm text-muted-foreground leading-relaxed", RICH_TEXT_CLASSES),
      },
    },
  });

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}

// ─── Read-only flat report view (used in /report) ───────────────────────────

const CHANNEL_ORDER = [null, "email", "web", "social"];

export function InsightsReport({ insights }: { insights: Insight[] }) {
  // Filter to only insights with actual content
  const withContent = insights.filter((i) => i.content && i.content.trim() !== "");

  if (!withContent.length) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No insights yet</p>
      </Card>
    );
  }

  // Group by groupId (same logic as the editable view)
  const groupMap = groupByGroupKey(withContent);
  const sortedKeys = sortGroupKeys(Array.from(groupMap.keys()), withContent);

  return (
    <div className="space-y-8">
      {sortedKeys.map((groupKey) => {
        const groupInsights = groupMap.get(groupKey)!;
        const label = getCustomGroupLabel(withContent, groupKey)
          ?? getCustomGroupLabel(insights, groupKey)
          ?? getDefaultGroupLabel(groupInsights);
        // Sort insights within group: cross-channel → email → web → social
        const sorted = [...groupInsights].sort(
          (a, b) => CHANNEL_ORDER.indexOf(a.channel) - CHANNEL_ORDER.indexOf(b.channel)
        );
        return (
          <div key={groupKey} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </h3>
            {sorted.map((insight) => (
              <Card key={insight.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={insight.channel ? (CHANNEL_COLORS[insight.channel] ?? "") : "bg-amber-100 text-amber-800"}
                  >
                    {insight.channel ?? "cross-channel"}
                  </Badge>
                </div>
                <h4 className="font-semibold">{insight.title}</h4>
                <InsightContentViewer content={insight.content} />
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Click-to-edit Insight Card ─────────────────────────────────────────────

function InsightCard({
  insight,
  canEdit,
  onSave,
  onDelete,
}: {
  insight: Insight;
  canEdit: boolean;
  onSave: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [title, setTitle] = React.useState(insight.title);
  const [savedContent, setSavedContent] = React.useState(insight.content);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Markdown,
      Placeholder.configure({ placeholder: "Write your insight content here…" }),
    ],
    content: insight.content,
    editable: false,
    editorProps: {
      attributes: {
        class: cn("min-h-[80px] text-sm", RICH_TEXT_CLASSES),
      },
    },
  });

  const handleStartEdit = React.useCallback(() => {
    if (!canEdit) return;
    editor?.setEditable(true);
    editor?.commands.focus("end");
    setIsEditing(true);
  }, [canEdit, editor]);

  const handleCancel = React.useCallback(() => {
    editor?.commands.setContent(savedContent);
    editor?.setEditable(false);
    setTitle(insight.title);
    setIsEditing(false);
  }, [editor, savedContent, insight.title]);

  const handleSave = React.useCallback(async () => {
    if (!editor) return;
    const content = editor.getHTML();
    setIsSaving(true);
    try {
      await onSave(insight.id, title, content);
      setSavedContent(content);
      editor.setEditable(false);
      setIsEditing(false);
    } catch {
      // keep editing open so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [editor, insight.id, title, onSave]);

  const handleDelete = React.useCallback(async () => {
    try {
      await onDelete(insight.id);
    } catch (err) {
      console.error("Failed to delete insight:", err);
    }
  }, [insight.id, onDelete]);

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={insight.channel ? (CHANNEL_COLORS[insight.channel] ?? "") : "bg-amber-100 text-amber-800"}
          >
            {insight.channel ?? "cross-channel"}
          </Badge>
          {canEdit && !isEditing && (
            <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-semibold"
          />
        ) : (
          <h4 className="font-semibold">{insight.title}</h4>
        )}

        {isEditing && editor && (
          <div className="flex flex-wrap items-center gap-0.5 border-b pb-2">
            {([
              { icon: Undo2,         title: "Undo",          action: () => editor.chain().focus().undo().run(),                       active: false },
              { icon: Redo2,         title: "Redo",          action: () => editor.chain().focus().redo().run(),                       active: false },
              null,
              { icon: Bold,          title: "Bold",          action: () => editor.chain().focus().toggleBold().run(),                 active: editor.isActive("bold") },
              { icon: Italic,        title: "Italic",        action: () => editor.chain().focus().toggleItalic().run(),               active: editor.isActive("italic") },
              { icon: Strikethrough, title: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run(),               active: editor.isActive("strike") },
              null,
              { icon: Heading2,      title: "Heading 2",     action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
              { icon: Heading3,      title: "Heading 3",     action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
              null,
              { icon: List,          title: "Bullet list",   action: () => editor.chain().focus().toggleBulletList().run(),           active: editor.isActive("bulletList") },
              { icon: ListOrdered,   title: "Ordered list",  action: () => editor.chain().focus().toggleOrderedList().run(),          active: editor.isActive("orderedList") },
              { icon: TextQuote,     title: "Blockquote",    action: () => editor.chain().focus().toggleBlockquote().run(),           active: editor.isActive("blockquote") },
              { icon: Code,          title: "Inline code",   action: () => editor.chain().focus().toggleCode().run(),                 active: editor.isActive("code") },
            ] as const).map((item, i) =>
              item === null ? (
                <div key={i} className="mx-1 h-3.5 w-px bg-border" />
              ) : (
                <button
                  key={item.title}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); item.action(); }}
                  title={item.title}
                  className={cn("rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors", item.active && "bg-accent text-foreground")}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </button>
              )
            )}
            <div className="mx-1 h-3.5 w-px bg-border" />
            <label title="Font color" className="relative flex cursor-pointer items-center rounded p-1.5 hover:bg-accent transition-colors">
              <span className="flex h-3.5 w-3.5 flex-col items-center justify-center gap-0.5">
                <span className="text-[10px] font-bold leading-none" style={{ color: editor.getAttributes("textStyle").color ?? "currentColor" }}>A</span>
                <span className="h-1 w-3.5 rounded-sm" style={{ backgroundColor: editor.getAttributes("textStyle").color ?? "#000000" }} />
              </span>
              <input
                type="color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={editor.getAttributes("textStyle").color ?? "#000000"}
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
            </label>
          </div>
        )}

        <div
          onClick={canEdit && !isEditing ? handleStartEdit : undefined}
          className={cn(canEdit && !isEditing && "cursor-text")}
        >
          <EditorContent editor={editor} />
        </div>

        {canEdit && !isEditing && (
          <p className="text-xs text-muted-foreground">Click to edit</p>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
