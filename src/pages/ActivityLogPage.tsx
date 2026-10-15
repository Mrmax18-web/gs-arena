import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  History,
  ArrowLeft,
  Filter,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Search,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import { TagChip } from '../components/ui/TagChip';
import { cn } from '../lib/cn';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Broadcast-grade security audit trail and activity log.
 * Tracks squad verification, rejections, deletes, and configuration adjustments.
 */
export function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const auditRef = collection(db, 'audit');
      const q = query(auditRef, orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AuditEntry[];
      setLogs(items);
    } catch (err) {
      console.warn('Activity log fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    try {
      const auditRef = collection(db, 'audit');
      const q = query(auditRef, orderBy('timestamp', 'desc'), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AuditEntry[];
        setLogs(items);
        setLoading(false);
      }, () => {
        setLoading(false);
      });
      return () => unsub();
    } catch {
      // Fallback
    }
  }, []);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const act = (log.action || '').toLowerCase();
        const type = (log.targetType || '').toLowerCase();
        const id = (log.targetId || '').toLowerCase();
        const admin = String(log.payload?.admin || '').toLowerCase();
        const team = String(log.payload?.teamName || '').toLowerCase();
        if (
          !act.includes(q) &&
          !type.includes(q) &&
          !id.includes(q) &&
          !admin.includes(q) &&
          !team.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('approve')) {
      return (
        <TagChip label={action.toUpperCase()} variant="success" size="sm" />
      );
    }
    if (act.includes('reject')) {
      return (
        <TagChip label={action.toUpperCase()} variant="danger" size="sm" />
      );
    }
    if (act.includes('delete')) {
      return (
        <TagChip label={action.toUpperCase()} variant="danger" size="sm" />
      );
    }
    return (
      <TagChip label={action.toUpperCase()} variant="cyan" size="sm" />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Activity Log"
        subtitle="System audit trail tracking all squad approvals, rejections, manual deletions, and configuration revisions."
        tag="SECURITY & AUDIT TRAIL"
        gradient="orange"
        icon={<History className="w-8 h-8 text-orange-400" />}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchLogs}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh Log</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activity by team, admin, or target ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-muted shrink-0 font-mono">FILTER:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-surface text-foreground border border-border rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-accent/50 font-mono transition-colors"
          >
            <option value="all" className="bg-surface text-foreground">All Events ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act} className="bg-surface text-foreground">
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Table */}
      {loading && logs.length === 0 ? (
        <div className="p-12 text-center text-muted text-xs animate-pulse font-mono">
          Loading audit trail records from Firestore...
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-muted" />}
          title="No Activity Entries Found"
          description="There are currently no recorded audit logs matching the active filter criteria."
        />
      ) : (
        <Card className="p-0 border border-border bg-surface/75 backdrop-blur-md overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-border text-muted uppercase font-mono text-xs">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin / Issuer</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((entry) => {
                  const dateStr = entry.timestamp
                    ? new Date(entry.timestamp).toLocaleString()
                    : 'N/A';
                  const adminStr =
                    String(entry.payload?.admin || entry.payload?.reviewedBy || 'System/Admin');
                  const teamStr = entry.payload?.teamName
                    ? String(entry.payload.teamName)
                    : '';
                  const reasonStr = entry.payload?.reason
                    ? String(entry.payload.reason)
                    : '';

                  return (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-white truncate max-w-[160px]">
                        {adminStr}
                      </td>
                      <td className="py-3 px-4">
                        {getActionBadge(entry.action)}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300/90 uppercase text-xs">
                        {entry.targetType || 'registration'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {teamStr && (
                          <span className="font-semibold text-white mr-2">
                            Squad: "{teamStr}"
                          </span>
                        )}
                        {reasonStr && (
                          <span className="text-rose-300 text-xs italic">
                            Reason: {reasonStr}
                          </span>
                        )}
                        {!teamStr && !reasonStr && (
                          <span className="font-mono text-xs text-slate-400">
                            ID: {entry.targetId}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
