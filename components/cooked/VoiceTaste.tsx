import { TEAM_MIN_UPVOTES, type Taste } from "@/lib/league";

// "Your voice": which of the four voices someone upvotes, from their votes.
export default function VoiceTaste({ taste, isMe, username }: { taste: Taste; isMe: boolean; username: string }) {
  const total = taste.reduce((s, t) => s + t.upvotes, 0);
  const top = taste[0];

  return (
    <section id="voice" aria-labelledby="voice-title" className="mt-6 scroll-mt-24 rounded-3xl bg-white p-6 ring-1 ring-stone-200">
      <h2 id="voice-title" className="text-[18px] font-bold text-stone-900">
        {isMe ? "Your voice" : "Their voice"}
      </h2>
      {total < TEAM_MIN_UPVOTES ? (
        <p className="mt-2 text-[14px] text-stone-600">
          {isMe
            ? `Upvote ${TEAM_MIN_UPVOTES - total} more caption${TEAM_MIN_UPVOTES - total === 1 ? "" : "s"} to find out which voice you’re on the team of.`
            : `@${username} hasn’t upvoted enough captions to pick a team yet.`}
        </p>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-stone-700">
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[13px] font-bold text-orange-800">
              Team {top.voice} {top.emoji}
            </span>
            {isMe ? "You laugh" : `@${username} laughs`} at {top.voice} <b>{Math.round(top.share * 100)}%</b> of the time.
          </p>
          <ul className="mt-4 flex flex-col gap-2" aria-label={`Share of ${total} upvotes by voice`}>
            {taste.map((t) => (
              <li key={t.voice} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3 text-[13.5px]">
                <span className="truncate font-semibold text-stone-800">
                  <span aria-hidden="true">{t.emoji}</span> {t.voice}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                  <span className={`block h-full rounded-full ${t === top ? "bg-orange-500" : "bg-stone-300"}`} style={{ width: `${t.share * 100}%` }} />
                </span>
                <span className="text-right tabular-nums text-stone-600">{Math.round(t.share * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-stone-500">
            From {total} upvotes. Votes stay private; only these totals are shown. Teams change as {isMe ? "you keep" : "they keep"} voting.
          </p>
        </>
      )}
    </section>
  );
}
