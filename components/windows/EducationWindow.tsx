"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { education } from "@/data/aminaos/education";

export default function EducationWindow() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      {/* Academic Background */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Academic Background
        </h2>
        <div className="space-y-6">
          {education.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {edu.degree}
              </h3>
              {edu.field && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {edu.field}
                </p>
              )}
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                {edu.institution}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{edu.startDate} - {edu.endDate}</span>
                {edu.gpa && (
                  <>
                    <span>•</span>
                    <span>GPA: {edu.gpa}</span>
                  </>
                )}
                {edu.honors && edu.honors.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-green-600 dark:text-green-400">
                      {edu.honors.join(", ")}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {edu.location}
              </p>
              {edu.note && (
                <p className="mt-1 text-sm italic text-blue-500 dark:text-blue-400">
                  {edu.note}
                </p>
              )}
              {edu.coursework && edu.coursework.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Relevant Coursework:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {edu.coursework.slice(0, 8).map((course) => (
                      <span
                        key={course}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {edu.activities && edu.activities.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Activities & Leadership:
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {edu.activities.map((activity, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
