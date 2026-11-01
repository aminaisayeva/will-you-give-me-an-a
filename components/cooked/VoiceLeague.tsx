import Link from "next/link";
import type { LeagueBoard } from "@/app/actions/cooked";
import { STYLE_EMOJI } from "@/lib/cooked";
import { TEAM_MIN_UPVOTES } from "@/lib/league";
import { focusRing } from "@/components/safari/cooked/shared";

const weekOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });

// This week's standings of the four voices, last week's crown, and your team.
export default function VoiceLeague({ board, username }: { board: LeagueBoard; username: string | null }) {
  const { league, champion, myTeam } = board;
  const most = Math.max(1, ...league.rows.map((r) => r.wins));

  return (
    <section aria-labelledby="league-title" className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 @xl:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="league-title" className="text-[16px] font-extrabold tracking-[-0.01em] text-stone-900">
          Voice League
        </h2>
        <p className="text-[12.5px] text-stone-500">
          {league.weekStart ? `Week of ${weekOf(league.weekStart)} · ` : ""}a win = top caption on a pic · resets Monday
        </p>
      </div>

      <ol className="mt-3 flex flex-col gap-1.5">
        {league.rows.map((r) => (
          <li key={r.voice} className="grid grid-cols-[1.5rem_minmax(0,11rem)_1fr_auto] items-center gap-3 text-[14px]">
            <span className="text-center font-bold tabular-nums text-stone-400">{r.rank}</span>
            <span className="flex min-w-0 items-center gap-1.5 font-semibold text-stone-900">
              <span aria-hidden="true">{r.emoji}</span>
              <span className="truncate">{r.voice}</span>
              {r.voice === champion && (
                <span title="Last week's Voice of the Week" aria-label="Last week's Voice of the Week">
                  👑
                </span>
              )}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
              <span
                className={`block h-full rounded-full ${r.rank === 1 && r.wins > 0 ? "bg-orange-500" : "bg-stone-300"}`}
                style={{ width: `${(r.wins / most) * 100}%` }}
              />
            </span>
            <span className="text-right text-[13px] tabular-nums text-stone-600">
              <b className="text-stone-900">{r.wins}</b> {r.wins === 1 ? "win" : "wins"}
              <span className="hidden text-stone-400 @md:inline">
                {" "}
                · {r.points > 0 ? "+" : ""}
                {r.points}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-[12.5px] text-stone-600">
        <p>
          {champion ? (
            <>
              👑 Last week’s Voice of the Week: <b className="text-stone-900">{champion} {STYLE_EMOJI[champion]}</b>
            </>
          ) : (
            "No Voice of the Week yet. Vote to crown one."
          )}
        </p>
        {myTeam ? (
          <Link href={username ? `/u/${username}#voice` : "/profile"} className={`rounded font-semibold text-orange-700 hover:underline ${focusRing}`}>
            You’re Team {myTeam.voice} {STYLE_EMOJI[myTeam.voice]} ({Math.round(myTeam.share * 100)}%)
          </Link>
        ) : (
          <p className="text-stone-500">Upvote {TEAM_MIN_UPVOTES} captions to find your team.</p>
        )}
      </div>
    </section>
  );
}
