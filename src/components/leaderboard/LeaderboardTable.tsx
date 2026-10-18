import React, { useState, useMemo } from 'react';
import { TournamentStandingsRow } from '../../types/tournament';
import { GameId } from '../../types/game';
import { Table, Column } from '../ui/Table';
import { Input } from '../ui/Input';
import { useDebounce } from '../../hooks/useDebounce';

export interface LeaderboardTableProps {
  standings: TournamentStandingsRow[];
  gameId: GameId;
  lastUpdated?: string | null;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  standings = [],
  gameId,
  lastUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 200);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return standings ?? [];
    const term = debouncedSearch.toLowerCase();
    return (standings || []).filter((s) => s?.teamName?.toLowerCase().includes(term));
  }, [standings, debouncedSearch]);

  const isCS = gameId === 'FF_CS';

  const columns: Column<TournamentStandingsRow>[] = useMemo(() => {
    const cols: Column<TournamentStandingsRow>[] = [
      {
        key: 'rank',
        header: '#',
        align: 'center',
        render: (item) => {
          const rank = item?.rank ?? 0;
          if (rank === 1) {
            return (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black font-extrabold text-xs shadow-md shadow-amber-500/30">
                1
              </span>
            );
          }
          if (rank === 2) {
            return (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs">
                2
              </span>
            );
          }
          if (rank === 3) {
            return (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white font-extrabold text-xs">
                3
              </span>
            );
          }
          return <span className="font-semibold text-slate-500">{rank}</span>;
        },
      },
      {
        key: 'teamName',
        header: 'Team',
        render: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">
              {item?.teamName ?? 'Unknown'}
            </span>
            {item?.isLeader && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                LEADER
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'matchesPlayed',
        header: 'Matches',
        align: 'center',
        render: (item) => <span className="font-mono">{item?.matchesPlayed ?? 0}</span>,
      },
    ];

    if (isCS) {
      cols.push(
        {
          key: 'matchWins',
          header: 'Wins',
          align: 'center',
          render: (item) => <span className="font-mono font-bold text-emerald-500">{item?.matchWins ?? 0}</span>,
        },
        {
          key: 'roundDifference',
          header: 'Round Diff',
          align: 'center',
          render: (item) => {
            const diff = item?.roundDifference ?? 0;
            return (
              <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            );
          },
        },
        {
          key: 'roundsWon',
          header: 'Rounds Won',
          align: 'center',
          render: (item) => <span className="font-mono">{item?.roundsWon ?? 0}</span>,
        }
      );
    } else {
      cols.push(
        {
          key: 'placementPoints',
          header: 'Place Pts',
          align: 'center',
          render: (item) => <span className="font-mono">{item?.placementPoints ?? 0}</span>,
        },
        {
          key: 'killPoints',
          header: 'Kill Pts',
          align: 'center',
          render: (item) => <span className="font-mono">{item?.killPoints ?? 0}</span>,
        },
        {
          key: 'totalKills',
          header: 'Kills',
          align: 'center',
          render: (item) => <span className="font-mono text-rose-400 font-semibold">{item?.totalKills ?? 0}</span>,
        },
        {
          key: 'wwcdCount',
          header: 'WWCD',
          align: 'center',
          render: (item) => (
            <span className="font-mono font-bold text-amber-500">
              {item?.wwcdCount ? `🏆 ${item.wwcdCount}` : '-'}
            </span>
          ),
        }
      );
    }

    cols.push({
      key: 'totalPoints',
      header: 'Total Pts',
      align: 'right',
      render: (item) => (
        <span className="font-mono font-black text-sm text-brand-600 dark:text-brand-400">
          {item?.totalPoints ?? 0}
        </span>
      ),
    });

    return cols;
  }, [isCS]);

  const mobileCardRender = (item: TournamentStandingsRow) => (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-xs font-bold">
            #{item?.rank ?? 0}
          </span>
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            {item?.teamName ?? 'Unknown'}
          </span>
          {item?.isLeader && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
              #1
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Points</span>
          <span className="font-mono font-black text-base text-brand-500">
            {item?.totalPoints ?? 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block">Matches</span>
          <span className="font-mono font-semibold">{item?.matchesPlayed ?? 0}</span>
        </div>
        {isCS ? (
          <>
            <div>
              <span className="text-[10px] text-slate-400 block">Wins</span>
              <span className="font-mono font-bold text-emerald-400">{item?.matchWins ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Round Diff</span>
              <span className="font-mono font-bold">{item?.roundDifference ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kills</span>
              <span className="font-mono text-rose-400">{item?.totalKills ?? 0}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-[10px] text-slate-400 block">Place Pts</span>
              <span className="font-mono">{item?.placementPoints ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Kill Pts</span>
              <span className="font-mono">{item?.killPoints ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">WWCD</span>
              <span className="font-mono text-amber-400 font-bold">{item?.wwcdCount ?? 0}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search & Meta Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search teams by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon="solar:magnifer-linear"
            className="py-2 text-xs"
          />
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-end sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live sync &bull; Updated {lastUpdated}</span>
          </div>
        )}
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredData}
        keyExtractor={(item, index) => item?.teamId || `row-${index}`}
        highlightRow={(item) => Boolean(item?.isLeader)}
        mobileCardRender={mobileCardRender}
        emptyText={
          searchTerm
            ? `No teams match "${searchTerm}".`
            : 'No standings recorded yet for this tournament.'
        }
      />
    </div>
  );
};
