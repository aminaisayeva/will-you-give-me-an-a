"use client";

import { motion } from "framer-motion";
import { Mail, MapPin } from "lucide-react";
import { personalInfo } from "@/data/aminaos/aboutMe";

// lucide-react no longer ships brand icons, so these are inlined.
function Github({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function Linkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export default function AboutWindow() {
  return (
    <div className="h-full overflow-y-auto p-8 space-y-6">
        <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">AI</span>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{personalInfo.name}</h2>
          <p className="text-blue-600 dark:text-blue-400 font-medium">{personalInfo.title}</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {personalInfo.location}
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {personalInfo.email}
            </div>
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
          <p>
            {personalInfo.bio}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {personalInfo.skills?.technical?.slice(0, 12).map((skill) => (
                <span key={skill} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                  {skill}
                </span>
              )) || []}
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Languages</h3>
            <div className="flex flex-wrap gap-2">
              {personalInfo.skills?.languages?.map((language) => (
                <span key={language} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
                  {language}
                </span>
              )) || []}
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {personalInfo.skills?.interests?.map((interest) => (
                <span key={interest} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">
                  {interest}
                </span>
              )) || []}
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <motion.button
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open(personalInfo.github, '_blank', 'noopener,noreferrer')}
          >
            <Github className="w-4 h-4" />
            GitHub
          </motion.button>
          <motion.button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open(personalInfo.linkedin, '_blank', 'noopener,noreferrer')}
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </motion.button>
          <motion.button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { window.location.href = `mailto:${personalInfo.email}`; }}
          >
            <Mail className="w-4 h-4" />
            Email
          </motion.button>
        </div>
      </div>
  );
}
