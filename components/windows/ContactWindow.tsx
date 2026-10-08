"use client";

import { Mail, MapPin } from "lucide-react";

// lucide-react no longer ships brand icons, so this one is inlined.
function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export default function ContactWindow() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Get In Touch
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            I&apos;d love to connect and discuss opportunities in technology, design,
            or collaborative projects.
          </p>
        </div>

        {/* Contact cards - 3 across, centered */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <a
            href="mailto:ai2464@columbia.edu"
            className="block bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center transition-shadow hover:shadow-md"
            data-testid="link-email"
          >
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">Email</h3>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 break-all">ai2464@columbia.edu</p>
          </a>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">Location</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">New York, NY</p>
          </div>

          <a
            href="https://www.linkedin.com/in/aminaisayeva/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center transition-shadow hover:shadow-md"
            data-testid="link-linkedin"
          >
            <Linkedin className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">LinkedIn</h3>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 break-all">/in/aminaisayeva</p>
          </a>
        </div>

        {/* Let&apos;s Connect */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Let&apos;s Connect
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
            I&apos;m a user-centric software engineer and designer with experience across
            full-stack development, AI/ML, and human-centered design. I&apos;m passionate
            about building intuitive, AI-powered products and collaborating on
            meaningful work.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs sm:text-sm whitespace-nowrap">
              Interaction Design
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs sm:text-sm whitespace-nowrap">
              Full-Stack Development
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs sm:text-sm whitespace-nowrap">
              AI / ML
            </span>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs sm:text-sm whitespace-nowrap">
              GenAI / Vibe Coding
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
