"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Clock, HardDrive } from "lucide-react";
import { documentFiles } from "@/data/aminaos/documentFiles";
import { useOS } from "@/lib/os/store";

const totalSize = documentFiles.reduce((total, file) => total + parseFloat(file.size), 0).toFixed(1);

function openFile(name: string) {
  useOS.getState().openWindow("text-viewer", { file: name });
}

export default function FilesWindow() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && selectedFile) {
      e.preventDefault();
      openFile(selectedFile);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                <HardDrive className="w-2 h-2 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{documentFiles.length} items</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{totalSize} KB total</div>
        </div>
      </div>

      {/* File List */}
      <div
        className="flex-1 overflow-y-auto p-4 outline-none"
        tabIndex={0}
        role="listbox"
        aria-label="Files"
        onKeyDown={handleKeyDown}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedFile(null);
        }}
      >
        <div className="space-y-1">
          {documentFiles.map((file, index) => (
            <motion.div
              key={file.name}
              role="option"
              aria-selected={selectedFile === file.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none transition-all duration-150 border
                ${
                  selectedFile === file.name
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                    : "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
              onClick={() => handleFileClick(file.name)}
              onDoubleClick={() => openFile(file.name)}
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm flex items-center justify-center relative">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600 rounded-b"></div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{file.size}</span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>Modified {file.dateModified}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{selectedFile ? `1 item selected` : `${documentFiles.length} items`}</span>
          <span>Double-click to open</span>
        </div>
      </div>
    </div>
  );
}
