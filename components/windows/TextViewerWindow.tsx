"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { documentFiles } from "@/data/aminaos/documentFiles";
import { useOS } from "@/lib/os/store";

export default function TextViewerWindow() {
  const fileName = useOS((s) => s.windows["text-viewer"].params.file);
  const file = fileName ? documentFiles.find((f) => f.name === fileName) : undefined;

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900 p-6">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {fileName ? "File Not Found" : "No File Selected"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {fileName
              ? `"${fileName}" could not be found in the Files folder.`
              : "Select a file from the Files folder to view its contents."}
          </p>
        </div>
      </div>
    );
  }

  const content = file.content;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm flex items-center justify-center relative">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-600 rounded-b"></div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{file.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Text Document</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={file.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            {content}
          </pre>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {content.split("\n").length} lines, {content.length} characters
          </span>
          <span>Plain Text</span>
        </div>
      </div>
    </div>
  );
}
