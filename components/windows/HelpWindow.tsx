"use client";

import { Terminal, Compass, BookOpen, MousePointer2 } from "lucide-react";

const terminalCommands = [
  { command: "pwd · ls · cd · tree", description: "See where you are, look around, move between folders" },
  { command: "cat · head · tail · less", description: "Read files" },
  { command: "mkdir · touch · echo > file", description: "Make folders and files" },
  { command: "cp · mv · rm · rmdir", description: "Copy, move/rename and delete" },
  { command: "grep · find · wc · sort · uniq", description: "Search, count and sort" },
  { command: "|  >  >>  <  &&  ;", description: "Pipes, redirection and chaining" },
  { command: "chmod · sudo · ls -l", description: "Permissions" },
  { command: "export · env · alias · which", description: "Your shell environment" },
  { command: "sh script.sh · ./script.sh", description: "Run scripts (with $1, $2 … arguments)" },
  { command: "man <command> · help", description: "Read the manual for any command" },
  { command: "open <app or site>", description: "Open apps and websites, e.g. open academy" },
];

const safariTips = [
  <>Open <strong>Terminal Academy</strong> from the desktop or the first icon in the Dock.</>,
  <>Each lesson explains one idea, gives you a few examples (click one to paste it), and lists tasks. Do them in the terminal on the right; they tick off as you go.</>,
  <>Stuck? Reveal hints one at a time. The last hint gives you the exact command.</>,
  <><strong>Module 1 is free.</strong> Sign in (top right) to unlock Modules 2–7 and save your progress; what you did as a guest comes with you.</>,
  <>Finish all 7 modules to earn your certificate (and your A) on <strong>final_grade.pdf</strong>.</>,
  <>Want to practice freely? The <strong>Terminal</strong> app is a playground whose files are saved in your browser.</>,
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Terminal Academy Help</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn the command line on a pretend Mac in your browser. Nothing you type can break anything.
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
          How the course works
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
        <p className="text-gray-500 dark:text-gray-400 text-sm">Have fun, and go earn that A.</p>
      </div>
    </div>
  );
}
