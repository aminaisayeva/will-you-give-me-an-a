"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Trash2, RotateCcw, X, FileText, Image, Folder, AlertTriangle, CheckCircle2 } from "lucide-react";

type TrashItem = {
  id: number;
  name: string;
  type: "document" | "image" | "folder";
  size: string;
  dateDeleted: string;
  originalLocation: string;
  icon: LucideIcon;
};

const initialItems: TrashItem[] = [
  {
    id: 1,
    name: "Old Resume Draft.pdf",
    type: "document",
    size: "245 KB",
    dateDeleted: "2 days ago",
    originalLocation: "~/Documents",
    icon: FileText,
  },
  {
    id: 2,
    name: "Screenshot 2025-01-10.png",
    type: "image",
    size: "1.2 MB",
    dateDeleted: "3 days ago",
    originalLocation: "~/Desktop",
    icon: Image,
  },
  {
    id: 3,
    name: "Backup Projects",
    type: "folder",
    size: "15.3 MB",
    dateDeleted: "5 days ago",
    originalLocation: "~/Documents",
    icon: Folder,
  },
  {
    id: 4,
    name: "temp_notes.txt",
    type: "document",
    size: "2 KB",
    dateDeleted: "1 week ago",
    originalLocation: "~/Desktop",
    icon: FileText,
  },
];

// What the inline confirm row is asking about.
type PendingDelete = { kind: "selected"; ids: number[] } | { kind: "single"; ids: number[]; name: string } | { kind: "empty" };

const getTypeColor = (type: string) => {
  switch (type) {
    case "document":
      return "text-blue-500";
    case "image":
      return "text-green-500";
    case "folder":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
};

export default function TrashWindow() {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const removeItems = (ids: number[]) => {
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSelectedItems((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const restore = (ids: number[]) => {
    if (ids.length === 0) return;
    const names = items.filter((item) => ids.includes(item.id)).map((item) => item.name);
    removeItems(ids);
    setPending(null);
    setNotice(
      names.length === 1 ? `"${names[0]}" Restored to Desktop` : `${names.length} items Restored to Desktop`,
    );
  };

  const confirmDelete = () => {
    if (!pending) return;
    if (pending.kind === "empty") {
      const count = items.length;
      setItems([]);
      setSelectedItems([]);
      setNotice(`Trash emptied (${count} item${count === 1 ? "" : "s"} permanently deleted)`);
    } else {
      removeItems(pending.ids);
      setNotice(
        pending.kind === "single"
          ? `"${pending.name}" permanently deleted`
          : `${pending.ids.length} item${pending.ids.length === 1 ? "" : "s"} permanently deleted`,
      );
    }
    setPending(null);
  };

  const pendingMessage = (() => {
    if (!pending) return "";
    if (pending.kind === "empty") {
      return `Permanently delete all ${items.length} items? This can't be undone.`;
    }
    if (pending.kind === "single") {
      return `Permanently delete "${pending.name}"? This can't be undone.`;
    }
    return `Permanently delete ${pending.ids.length} item${pending.ids.length === 1 ? "" : "s"}? This can't be undone.`;
  })();

  return (
    <div className="h-full bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Trash2 className="w-6 h-6 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Trash</h2>
            <span className="text-sm text-gray-500">{items.length} items</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAll}
              disabled={items.length === 0}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              {items.length > 0 && selectedItems.length === items.length ? "Deselect All" : "Select All"}
            </button>

            {selectedItems.length > 0 && (
              <>
                <button
                  onClick={() => restore(selectedItems)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-[#007aff] text-white rounded-lg hover:bg-[#006ae0]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore ({selectedItems.length})</span>
                </button>

                <button
                  onClick={() => {
                    setNotice(null);
                    setPending({ kind: "selected", ids: [...selectedItems] });
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                  <span>Delete Forever ({selectedItems.length})</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setNotice(null);
              setPending({ kind: "empty" });
            }}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            disabled={items.length === 0}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Empty Trash</span>
          </button>
        </div>

        {/* Inline confirm row */}
        {pending && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
            <span className="text-sm text-red-700 dark:text-red-300">{pendingMessage}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setPending(null)}
                className="px-3 py-1 text-sm rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Inline confirmation */}
        {notice && !pending && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {notice}
            </span>
            <button
              onClick={() => setNotice(null)}
              className="text-green-700/70 hover:text-green-800 dark:text-green-300/70 dark:hover:text-green-200"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <Trash2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Trash is Empty</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Items you delete will appear here before being permanently removed.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center space-x-4 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedItems.includes(item.id)
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />

                <item.icon className={`w-8 h-8 ${getTypeColor(item.type)}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</h3>
                    <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">{item.size}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>Deleted {item.dateDeleted}</span>
                    <span>•</span>
                    <span>Originally in {item.originalLocation}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restore([item.id]);
                    }}
                    className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotice(null);
                      setPending({ kind: "single", ids: [item.id], name: item.name });
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    title="Delete Forever"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Footer */}
      {items.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Items in Trash</p>
              <p>
                Items will be automatically deleted after 30 days. To free up space immediately, select items and
                click &quot;Delete Forever&quot; or &quot;Empty Trash&quot;.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
