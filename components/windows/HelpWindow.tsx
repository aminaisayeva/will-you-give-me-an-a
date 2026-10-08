"use client";

import { Terminal, Compass, BookOpen, MousePointer2 } from "lucide-react";

const terminalCommands = [
  { command: "help", description: "Show available commands" },
  { command: "ls [-la]", description: "List directory contents (-la shows hidden files and details)" },
  { command: "cd [path]", description: "Change directory" },
  { command: "pwd", description: "Print working directory" },
  { command: "cat [file]", description: "Display file contents" },
  { command: "open [app|file|site]", description: "Open an application, a file, or a website in Safari" },
  { command: "safari [address]", description: "Open a website in Safari, e.g. safari cooked.ai" },
  { command: "grep [pattern] [file]", description: "Search for a pattern in a file" },
  { command: "man [command]", description: "Show the manual page for a command" },
  { command: "clear", description: "Clear the terminal screen" },
  { command: "whoami", description: "Display the current user" },
  { command: "date", description: "Show the current date and time" },
  { command: "history", description: "List the commands you have run" },
];

const safariTips = [
  <>
    Open <code className="font-mono text-blue-700 dark:text-blue-300">cooked.ai</code> in Safari (it’s in Favorites, on the
    desktop, and the first thing you see after logging in).
  </>,
  <>Upload a pic and Google Gemini roasts it four ways: Chronically Online, Midwest Mom, Real New Yorker and Columbia Tour Guide.</>,
  <>Signed-in users vote on every caption. The best one gets the COOKED badge, and the top caption of the day gets the banner.</>,
  <>
    Browse with the <strong>Hot</strong>, <strong>New</strong>, <strong>Top</strong> and <strong>My Pics</strong> tabs.
  </>,
  <>Safari knows a few other addresses too. Curious people tend to find them.</>,
];

const navigationTips = [
  { key: "Dock", description: "Click an app in the Dock to open it" },
  { key: "Drag", description: "Desktop icons can be dragged anywhere on the desktop" },
  { key: "⌘ K", description: "Open Spotlight search" },
  { key: " menu", description: "System Settings, Lock Screen and Log Out" },
  { key: "Green button", description: "Zoom a window to fill the screen" },
  { key: "Double-click", description: "Double-click a title bar to zoom the window" },
];

export default function HelpWindow() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      {/* Welcome */}
      <section>
        <div className="text-center mb-6">
          <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">AminaOS Help</h1>
          <p className="text-gray-600 dark:text-gray-400">
            A macOS-inspired desktop with a working terminal and AI-powered cooked.ai in Safari
          </p>
        </div>
      </section>

      {/* Terminal Commands */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Terminal commands
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="grid gap-3">
            {terminalCommands.map((cmd) => (
              <div
                key={cmd.command}
                className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0"
              >
                <code className="text-green-600 dark:text-green-400 font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded whitespace-nowrap">
                  {cmd.command}
                </code>
                <span className="text-gray-600 dark:text-gray-400 text-sm flex-1 ml-4">{cmd.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safari */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5" />
          cooked.ai: get your pics roasted
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <div className="space-y-2">
            {safariTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <MousePointer2 className="w-5 h-5" />
          Getting around
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
          {navigationTips.map((tip) => (
            <div key={tip.key} className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs whitespace-nowrap">{tip.key}</kbd>
              <span className="text-gray-700 dark:text-gray-300 text-sm">{tip.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Explore, get cooked, and have fun!</p>
      </div>
    </div>
  );
}
