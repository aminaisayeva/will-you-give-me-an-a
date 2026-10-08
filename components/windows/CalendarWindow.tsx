"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, X, CheckCircle2 } from "lucide-react";

// Same shape as the source repo's shared/schema.ts CalendarEvent, minus the
// server session id: events here live only in this viewer's localStorage.
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: string;
  location: string;
  attendees: string[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

type NewEventInput = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

// Serialized form kept in localStorage (dates as ISO strings).
type StoredEvent = Omit<CalendarEvent, "date" | "createdAt" | "updatedAt"> & {
  date: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "will-you-give-me-an-a:calendar";
const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Tiny localStorage-backed store, read through useSyncExternalStore.  */
/* ------------------------------------------------------------------ */

let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function seedEvents(): StoredEvent[] {
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const make = (offsetDays: number, e: Omit<StoredEvent, "id" | "date" | "createdAt" | "updatedAt">): StoredEvent => ({
    ...e,
    id: newId(),
    date: new Date(now + offsetDays * DAY_MS).toISOString(),
    createdAt: stamp,
    updatedAt: stamp,
  });
  return [
    make(0, {
      title: "Portfolio Review Meeting",
      description: "",
      duration: "1 hour",
      location: "Virtual",
      attendees: ["Hiring Manager", "Tech Lead"],
      color: "bg-blue-500",
    }),
    make(1, {
      title: "Technical Interview",
      description: "",
      duration: "2 hours",
      location: "Zoom",
      attendees: ["Senior Developer", "Team Manager"],
      color: "bg-green-500",
    }),
    make(2, {
      title: "Project Demo",
      description: "",
      duration: "30 minutes",
      location: "Conference Room A",
      attendees: ["Product Team"],
      color: "bg-purple-500",
    }),
  ];
}

function writeRaw(raw: string) {
  cachedRaw = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Storage unavailable (private mode, quota): keep the in-memory copy.
  }
}

function getSnapshot(): string {
  if (cachedRaw !== null) return cachedRaw;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  if (stored !== null) {
    cachedRaw = stored;
  } else {
    // First visit: seed the same three sample events as the original app.
    writeRaw(JSON.stringify(seedEvents()));
  }
  return cachedRaw as string;
}

const EMPTY = "[]";
function getServerSnapshot(): string {
  return EMPTY;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cachedRaw = e.newValue;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function parseEvents(raw: string): CalendarEvent[] {
  try {
    const data = JSON.parse(raw) as StoredEvent[];
    if (!Array.isArray(data)) return [];
    return data.map((e) => ({
      ...e,
      attendees: Array.isArray(e.attendees) ? e.attendees : [],
      date: new Date(e.date),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    }));
  } catch {
    return [];
  }
}

function addEvent(input: NewEventInput) {
  const current = (() => {
    try {
      return JSON.parse(getSnapshot()) as StoredEvent[];
    } catch {
      return [];
    }
  })();
  const stamp = new Date().toISOString();
  const next: StoredEvent[] = [
    ...current,
    { ...input, id: newId(), date: input.date.toISOString(), createdAt: stamp, updatedAt: stamp },
  ];
  writeRaw(JSON.stringify(next));
  emit();
}

/* ------------------------------------------------------------------ */

const formatHour = (hour: number) =>
  hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;

export default function CalendarWindow() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const events = useMemo(() => parseEvents(raw), [raw]);

  const [today] = useState(() => new Date());
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCreate = (eventData: NewEventInput) => {
    addEvent(eventData);
    setShowAddEvent(false);
    setSelectedDate(eventData.date);
    setNotice(`"${eventData.title}" added to your calendar`);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(1);
    newDate.setMonth(currentDate.getMonth() + (direction === "prev" ? -1 : 1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter((event) => event.date.toDateString() === date.toDateString());
  };

  const hasEvent = (date: Date | null) => getEventsForDate(date).length > 0;

  const days = getDaysInMonth(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Week view helper functions
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(start);
      weekDay.setDate(start.getDate() + i);
      week.push(weekDay);
    }
    return week;
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "prev" ? -7 : 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === "prev" ? -1 : 1));
    setCurrentDate(newDate);
  };

  const formatWeekRange = (date: Date) => {
    const week = getWeekDays(date);
    const start = week[0];
    const end = week[6];

    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
  };

  const formatDayHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEventsForDay = (date: Date) => {
    return events
      .filter((event) => event.date.toDateString() === date.toDateString())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1 flex-1">
      {/* Week day headers */}
      {weekDays.map((day) => (
        <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {days.map((date, index) => (
        <div
          key={date ? date.toDateString() : `empty-${index}`}
          onClick={() => date && setSelectedDate(date)}
          className={`
            aspect-square p-2 border border-gray-100 dark:border-gray-700 cursor-pointer
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
            ${date ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
            ${date && isToday(date) ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700" : ""}
            ${date && selectedDate.toDateString() === date.toDateString() ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}
          `}
        >
          {date && (
            <>
              <div
                className={`text-sm font-medium ${
                  isToday(date) ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {date.getDate()}
              </div>
              {hasEvent(date) && (
                <div className="flex space-x-1 mt-1">
                  {getEventsForDate(date)
                    .slice(0, 2)
                    .map((event) => (
                      <div key={event.id} className={`w-2 h-2 rounded-full ${event.color}`}></div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );

  const renderWeekView = () => {
    const weekDates = getWeekDays(currentDate);
    return (
      <div className="flex-1 flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-1 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 text-sm font-medium text-gray-600 dark:text-gray-400"></div>
          {weekDates.map((date) => (
            <div
              key={date.toDateString()}
              className={`p-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded
                 ${isToday(date) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200"}
                 ${selectedDate.toDateString() === date.toDateString() ? "ring-2 ring-blue-500 dark:ring-blue-400 rounded" : ""}`}
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-sm font-medium">{date.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Week grid with time slots */}
        <div className="flex-1">
          <div className="grid grid-cols-8 gap-1 min-h-[600px]">
            {/* Time column */}
            <div className="border-r border-gray-200 dark:border-gray-700">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="h-12 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDates.map((date) => (
              <div key={date.toDateString()} className="relative border-r border-gray-200 dark:border-gray-700">
                {/* Hour grid lines */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <div key={hour} className="h-12 border-b border-gray-100 dark:border-gray-800"></div>
                ))}

                {/* Events for this day */}
                {getEventsForDay(date).map((event, index) => {
                  const topPosition = event.date.getHours() * 48 + (event.date.getMinutes() * 48) / 60;

                  return (
                    <div
                      key={event.id}
                      className={`absolute p-1 rounded text-xs text-white z-10 ${event.color}`}
                      style={{
                        top: `${topPosition}px`,
                        height: "44px",
                        left: `${4 + index * 2}px`,
                        right: "4px",
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-90 truncate">
                        {event.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);

    return (
      <div className="flex-1 flex">
        {/* Time column */}
        <div className="w-20 border-r border-gray-200 dark:border-gray-700">
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="h-16 px-2 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800"
            >
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1 relative">
          {/* Hour grid lines */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="h-16 border-b border-gray-100 dark:border-gray-800"></div>
          ))}

          {/* Events for the day */}
          {dayEvents.map((event, index) => {
            const topPosition = event.date.getHours() * 64 + (event.date.getMinutes() * 64) / 60;

            return (
              <div
                key={event.id}
                className={`absolute p-3 rounded-lg text-white shadow-sm z-10 ${event.color}`}
                style={{
                  top: `${topPosition}px`,
                  height: "56px",
                  left: `${8 + index * 4}px`,
                  right: "8px",
                }}
              >
                <div className="font-medium truncate leading-tight">{event.title}</div>
                <div className="text-sm opacity-90 truncate leading-tight">
                  {event.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} • {event.duration}
                  {event.location ? ` • ${event.location}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div className="relative h-full bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
          </div>

          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New Event</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (view === "month") navigateMonth("prev");
                else if (view === "week") navigateWeek("prev");
                else navigateDay("prev");
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 min-w-[200px] text-center">
              {view === "month" && formatMonth(currentDate)}
              {view === "week" && formatWeekRange(currentDate)}
              {view === "day" && formatDayHeader(currentDate)}
            </h3>
            <button
              onClick={() => {
                if (view === "month") navigateMonth("next");
                else if (view === "week") navigateWeek("next");
                else navigateDay("next");
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            {(["month", "week", "day"] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 py-1 rounded text-sm capitalize ${
                  view === viewType
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>
        </div>

        {/* Inline confirmation (replaces the source's toast) */}
        {notice && (
          <div
            role="status"
            className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2"
          >
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

      <div className="flex-1 flex min-h-0">
        {/* Calendar Content */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 flex flex-col">
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </div>

        {/* Event Details Sidebar - Only show in month view */}
        {view === "month" && (
          <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              <div className="space-y-3">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event) => (
                    <div key={event.id} className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full ${event.color} mt-1 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{event.description}</p>
                          )}

                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                {event.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} •{" "}
                                {event.duration}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.attendees.length > 0 && (
                              <div className="flex items-center space-x-2">
                                <Users className="w-3 h-3" />
                                <span>{event.attendees.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No events scheduled for this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal (absolute, not fixed: the window frame uses transforms) */}
      {showAddEvent && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddEvent(false);
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-full max-h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Add New Event</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <NewEventForm selectedDate={selectedDate} onSubmit={handleCreate} onCancel={() => setShowAddEvent(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

// Format for a datetime-local input, in local time. Dates picked from the
// month grid are at midnight, so default those to 9:00 AM.
function toDateTimeLocal(date: Date) {
  const d = new Date(date);
  if (d.getHours() === 0 && d.getMinutes() === 0) d.setHours(9);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputClass =
  "mt-1 w-full rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/30";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

const durationOptions = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "1 hour",
  "1.5 hours",
  "2 hours",
  "3 hours",
  "All day",
];

const colorOptions = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-gray-500", label: "Gray" },
];

// Event creation form component
function NewEventForm({
  selectedDate,
  onSubmit,
  onCancel,
}: {
  selectedDate: Date;
  onSubmit: (data: NewEventInput) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(() => ({
    title: "",
    description: "",
    date: toDateTimeLocal(selectedDate),
    duration: "1 hour",
    location: "",
    attendees: "",
    color: "bg-blue-500",
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date(formData.date);
    if (!formData.title.trim() || Number.isNaN(date.getTime())) return;
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      date,
      duration: formData.duration,
      location: formData.location.trim(),
      attendees: formData.attendees
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      color: formData.color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="event-title" className={labelClass}>
          Event Title *
        </label>
        <input
          id="event-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          className={inputClass}
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="event-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="event-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Event description (optional)"
          className={`${inputClass} resize-none`}
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="event-date" className={labelClass}>
          Date & Time *
        </label>
        <input
          id="event-date"
          type="datetime-local"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="event-duration" className={labelClass}>
          Duration
        </label>
        <select
          id="event-duration"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className={inputClass}
        >
          {durationOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="event-location" className={labelClass}>
          Location
        </label>
        <input
          id="event-location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Meeting room, Zoom link, etc."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="event-attendees" className={labelClass}>
          Attendees
        </label>
        <input
          id="event-attendees"
          type="text"
          value={formData.attendees}
          onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
          placeholder="Separate names with commas"
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Color</span>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={formData.color === option.value}
              aria-label={option.label}
              title={option.label}
              onClick={() => setFormData({ ...formData, color: option.value })}
              className={`w-6 h-6 rounded-full ${option.value} ${
                formData.color === option.value
                  ? "ring-2 ring-offset-2 ring-[#007aff] dark:ring-offset-gray-800"
                  : "opacity-80 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        >
          Create Event
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#007aff]/30"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
