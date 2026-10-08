"use client";

import Avatar from "@/components/Avatar";
import { useAccount } from "@/components/os/AccountContext";
import SignInPrompt from "@/components/os/SignInPrompt";

const COURSES = [
  { code: "CS 4995", title: "Generative AI", credits: 3 },
  { code: "CS 4111", title: "Introduction to Databases", credits: 3 },
  { code: "COMS 4170", title: "User Interface Design", credits: 3 },
  { code: "PSYC 1001", title: "The Science of Persuasion", credits: 3 },
  { code: "HUMN 2000", title: "Being Definitely Not an AI", credits: 1 },
];

// final_grade.pdf: the official transcript, only for signed-in students.
export default function TranscriptWindow() {
  const account = useAccount();
  if (!account) {
    return <SignInPrompt app="final_grade.pdf" glyph={"\u{1F512}"} reason="Your transcript is only visible to signed-in students." />;
  }
  const name = account.name;
  const issued = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const credits = COURSES.reduce((sum, c) => sum + c.credits, 0);

  return (
    <div className="h-full overflow-y-auto bg-[#e8e8ec] p-3 sm:p-6">
      <article className="mx-auto bg-white px-6 py-8 text-gray-900 shadow-md sm:px-10">
        <header className="flex items-start justify-between gap-4 border-b-2 border-gray-900 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Office of the Registrar
            </p>
            <h1 className="mt-1 font-serif text-[24px] font-bold leading-tight">Official Transcript</h1>
            <p className="mt-1 text-[12px] text-gray-500">Fall 2026 · Issued {issued}</p>
          </div>
          <Avatar src={account.avatar} name={name} size={64} className="ring-1 ring-black/10" />
        </header>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
          <dt className="text-gray-500">Student</dt>
          <dd className="font-semibold">{name}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd className="break-all">{account.email}</dd>
          <dt className="text-gray-500">Status</dt>
          <dd>Human (self-reported, “i think”)</dd>
        </dl>

        <table className="mt-6 w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-gray-300 text-[11px] uppercase tracking-wide text-gray-500">
              <th className="py-1.5 pr-2 font-semibold">Course</th>
              <th className="py-1.5 pr-2 font-semibold">Title</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Cr.</th>
              <th className="py-1.5 text-right font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {COURSES.map((c) => (
              <tr key={c.code} className="border-b border-gray-100">
                <td className="whitespace-nowrap py-2 pr-2 font-mono text-[12px] text-gray-600">{c.code}</td>
                <td className="py-2 pr-2">{c.title}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{c.credits}</td>
                <td className="py-2 text-right font-bold text-green-700">A</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-[13px]">
              <td colSpan={2} className="pt-3 font-semibold">Term GPA</td>
              <td className="pt-3 pr-2 text-right tabular-nums">{credits}</td>
              <td className="pt-3 text-right font-bold tabular-nums">4.00</td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-10 flex items-end justify-between gap-4">
          <p className="max-w-[60%] text-[11px] leading-relaxed text-gray-400">
            This transcript is only visible to signed-in students. Grades are
            final and were agreed to by clicking Yes.
          </p>
          <div className="text-center">
            <p className="font-serif text-[22px] italic text-[#1d3fbf]">The Professor</p>
            <p className="border-t border-gray-300 pt-1 text-[10px] uppercase tracking-wide text-gray-400">
              Registrar signature
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
