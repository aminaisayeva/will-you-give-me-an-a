"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Code, Database, Sparkles, Globe, Monitor, Rocket } from "lucide-react";

type TechStack = {
  category: string;
  icon: ReactNode;
  items: string[];
};

const techStacks: TechStack[] = [
  {
    category: "Frontend",
    icon: <Monitor className="w-5 h-5" />,
    items: [
      "Next.js 16 with the App Router for routing, layouts and server rendering",
      "React 19 with TypeScript for type-safe components",
      "Tailwind CSS v4 with a macOS-inspired look and dark mode",
      "framer-motion for window, dock and desktop animations",
      "zustand for lightweight window-manager state",
      "lucide-react for icons",
    ],
  },
  {
    category: "Backend & Data",
    icon: <Database className="w-5 h-5" />,
    items: [
      "Supabase Postgres as the database",
      "Row Level Security enabled on every table",
      "Supabase Auth with Google OAuth and email/password accounts",
      "Supabase Storage for profile avatars",
      "Next.js Server Actions and Route Handlers for all server-side logic",
    ],
  },
  {
    category: "AI",
    icon: <Sparkles className="w-5 h-5" />,
    items: [
      "cooked.ai: Google Gemini looks at your photo and writes captions in four voices",
      "Photos live in Supabase Storage; prompts, models and captions are saved in Postgres",
      "Signed-in users upvote and downvote captions; triggers keep the scores",
    ],
  },
  {
    category: "Deployment",
    icon: <Rocket className="w-5 h-5" />,
    items: ["Hosted on Vercel"],
  },
];

const highlights = [
  "Pixel-perfect macOS desktop recreation",
  "Draggable, resizable, zoomable windows",
  "Terminal with a virtual filesystem",
  "AI photo captions on cooked.ai",
  "Real accounts with Google sign-in",
  "Row Level Security on all data",
];

export default function AboutOSWindow() {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About AminaOS</h1>
            <p className="text-gray-600 dark:text-gray-400">Grade Request Edition</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Project Overview</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  AminaOS (Grade Request Edition) is a class project for a Generative AI course at Columbia
                  University. It recreates the macOS desktop in the browser, complete with a dock, windows,
                  a terminal and real user accounts. Its Safari opens cooked.ai, where Google Gemini roasts
                  the photos you upload and everyone votes on which caption cooked hardest. (Rumor has it
                  Safari can reach a few other sites, too.)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Tech Stack Sections */}
          <div className="grid gap-6">
            {techStacks.map((stack, index) => (
              <motion.div
                key={stack.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {stack.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{stack.category}</h3>
                </div>
                <ul className="space-y-2">
                  {stack.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Highlights</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
