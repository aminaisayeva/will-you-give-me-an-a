"use client";

import Avatar from "@/components/Avatar";
import { useAccount } from "@/components/os/AccountContext";
import SignInPrompt from "@/components/os/SignInPrompt";
import { MODULES } from "@/lib/course/curriculum";
import { useProgress } from "@/lib/course/progress";
import { useOS } from "@/lib/os/store";

// final_grade.pdf: your Terminal Academy transcript. Signed-in only.
export default function TranscriptWindow() {
  const account = useAccount();
  const completed = useProgress((s) => s.completed);
  const loaded = useProgress((s) => s.loaded);

  if (!account) {
    return <SignInPrompt app="final_grade.pdf" glyph={"\u{1F512}"} reason="Your Terminal Academy transcript is only visible to signed-in students." />;
  }

  const rows = MODULES.map((m) => {
    const done = m.lessons.filter((l) => completed.includes(l.id)).length;
    const grade = done === m.lessons.length ? "A" : done > 0 ? "IP" : "—";
    return { module: m, done, grade };
  });
  const finished = rows.every((r) => r.grade === "A");
  const totalDone = rows.reduce((n, r) => n + r.done, 0);
  const totalLessons = rows.reduce((n, r) => n + r.module.lessons.length, 0);
  const issued = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="h-full overflow-y-auto bg-[#e8e8ec] p-3 sm:p-6">
      <article className="mx-auto bg-white px-6 py-8 text-gray-900 shadow-md sm:px-10">
        <header className="flex items-start justify-between gap-4 border-b-2 border-gray-900 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Terminal Academy · Registrar</p>
            <h1 className="mt-1 font-serif text-[24px] font-bold leading-tight">{finished ? "Certificate of Completion" : "Official Transcript"}</h1>
            <p className="mt-1 text-[12px] text-gray-500">Issued {issued}</p>
          </div>
          <Avatar src={account.avatar} name={account.name} size={64} className="ring-1 ring-black/10" />
        </header>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
          <dt className="text-gray-500">Student</dt>
          <dd className="font-semibold">{account.name}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd className="break-all">{account.email}</dd>
          <dt className="text-gray-500">Progress</dt>
          <dd>
            {loaded ? `${totalDone} of ${totalLessons} lessons` : "Loading…"}
            <span className="ml-2 inline-block h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 align-middle">
              <span className="block h-full bg-indigo-500" style={{ width: `${(totalDone / totalLessons) * 100}%` }} />
            </span>
          </dd>
        </dl>

        <table className="mt-6 w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-gray-300 text-[11px] uppercase tracking-wide text-gray-500">
              <th className="py-1.5 pr-2 font-semibold">Module</th>
              <th className="py-1.5 pr-2 font-semibold">Title</th>
              <th className="py-1.5 pr-2 text-right font-semibold">Lessons</th>
              <th className="py-1.5 text-right font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ module, done, grade }) => (
              <tr key={module.id} className="border-b border-gray-100">
                <td className="whitespace-nowrap py-2 pr-2 font-mono text-[12px] text-gray-600">TERM {module.id}00</td>
                <td className="py-2 pr-2">{module.title}</td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {done}/{module.lessons.length}
                </td>
                <td className={`py-2 text-right font-bold ${grade === "A" ? "text-green-700" : grade === "IP" ? "text-amber-600" : "text-gray-400"}`}>
                  {grade}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-[13px]">
              <td colSpan={3} className="pt-3 font-semibold">
                Final grade
              </td>
              <td className={`pt-3 text-right text-[16px] font-black ${finished ? "text-green-700" : "text-gray-400"}`}>{finished ? "A" : "IP"}</td>
            </tr>
          </tfoot>
        </table>

        {finished ? (
          <p className="mt-6 rounded-lg bg-green-50 p-4 text-center font-serif text-[15px] italic text-green-900">
            This certifies that <strong className="not-italic">{account.name}</strong> completed all {MODULES.length} modules of Terminal Academy,
            and has, at long last, earned an A.
          </p>
        ) : (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-center text-[13px] text-gray-600">
            IP = in progress. Finish every lesson to earn your certificate (and your A).
            <button
              type="button"
              onClick={() => useOS.getState().openWindow("academy")}
              className="mx-auto mt-3 block rounded-md bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-500"
            >
              Continue in Terminal Academy
            </button>
          </div>
        )}

        <footer className="mt-10 flex items-end justify-between gap-4">
          <p className="max-w-[60%] text-[11px] leading-relaxed text-gray-400">
            Grades update automatically as you complete lessons. Only you can see this transcript.
          </p>
          <div className="text-center">
            <p className="font-serif text-[22px] italic text-[#1d3fbf]">The Registrar</p>
            <p className="border-t border-gray-300 pt-1 text-[10px] uppercase tracking-wide text-gray-400">Terminal Academy</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
