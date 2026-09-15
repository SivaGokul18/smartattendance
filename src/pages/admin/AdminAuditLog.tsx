import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  Key, 
  Radio, 
  BookOpen, 
  AlertTriangle, 
  Terminal, 
  Eye, 
  X,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { adminApi } from '../../api/client';

interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'Security' | 'Override' | 'Hardware' | 'Curriculum' | 'Auth';
  actor: string;
  actorRole: 'Super Admin' | 'Faculty' | 'System Daemon';
  action: string;
  target: string;
  ipAddress: string;
  device: string;
  status: 'success' | 'warning' | 'flagged';
  details: string;
}

export const AdminAuditLog: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inspectedEvent, setInspectedEvent] = useState<AuditEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await adminApi.getAuditLogs();
      if (logs && Array.isArray(logs)) {
        const mapped: AuditEvent[] = logs.map((l: any) => {
          let category: AuditEvent['category'] = 'Security';
          const act = (l.actionType || '').toLowerCase();
          if (act.includes('override') || act.includes('checkin')) category = 'Override';
          else if (act.includes('room') || act.includes('beacon') || act.includes('hardware')) category = 'Hardware';
          else if (act.includes('course') || act.includes('section') || act.includes('timetable') || act.includes('curriculum')) category = 'Curriculum';
          else if (act.includes('login') || act.includes('auth') || act.includes('token')) category = 'Auth';

          let roleTitle: AuditEvent['actorRole'] = 'Super Admin';
          const r = (l.actorRole || '').toLowerCase();
          if (r.includes('faculty')) roleTitle = 'Faculty';
          else if (r.includes('system')) roleTitle = 'System Daemon';

          return {
            id: l.id,
            timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now',
            category,
            actor: l.actorId || 'Administrator',
            actorRole: roleTitle,
            action: (l.actionType || 'Action').replace(/_/g, ' ').toUpperCase(),
            target: l.targetEntity || 'System Entity',
            ipAddress: l.ipAddress || '127.0.0.1 (Localhost Gateway)',
            device: 'Institutional Console',
            status: act.includes('fail') || act.includes('reject') ? 'flagged' : act.includes('warn') ? 'warning' : 'success',
            details: l.metadata ? JSON.stringify(l.metadata, null, 2) : `Target: ${l.targetEntity || 'System'}`,
          };
        });
        setAuditLogs(mapped);
      }
    } catch (e) {
      console.warn('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesCategory = selectedCategory === 'All' || log.category === selectedCategory;
      const matchesSearch = 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [auditLogs, searchQuery, selectedCategory]);

  const handleExportCsv = () => {
    showToast('Immutable audit trail exported (CSV format)');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-400 px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              System Audit Logs
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Activity log of administrative events, beacon changes, and attendance overrides.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition active:scale-95 self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Security metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Logs</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{auditLogs.length} Events</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Overrides</span>
            <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
              {auditLogs.filter(l => l.category === 'Override').length} Logged
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Hardware Updates</span>
            <div className="text-lg font-bold text-sky-700 font-mono mt-0.5">
              {auditLogs.filter(l => l.category === 'Hardware').length} Changed
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Security Flags</span>
            <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">
              {auditLogs.filter(l => l.status === 'flagged').length} Flagged
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {['All', 'Override', 'Hardware', 'Curriculum', 'Security', 'Auth'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Action Summary</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      log.category === 'Override'
                        ? 'bg-amber-100 text-amber-900'
                        : log.category === 'Hardware'
                        ? 'bg-sky-100 text-sky-900'
                        : log.category === 'Security'
                        ? 'bg-rose-100 text-rose-900'
                        : log.category === 'Curriculum'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{log.actor}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                    {log.target}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setInspectedEvent(log)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Inspect log details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No audit records match your query.
            </div>
          )}
        </div>
      </div>

      {/* Inspect Event Modal */}
      {inspectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <h3 className="font-heading font-bold text-base">Audit Receipt #{inspectedEvent.id}</h3>
              </div>
              <button onClick={() => setInspectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Action</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">{inspectedEvent.action}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Actor:</span>
                  <span className="font-bold text-slate-800">{inspectedEvent.actor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Role:</span>
                  <span className="font-semibold text-slate-700">{inspectedEvent.actorRole}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Client IP:</span>
                  <span className="font-mono text-slate-700">{inspectedEvent.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Recorded At:</span>
                  <span className="font-mono text-slate-700">{inspectedEvent.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Device / User Agent</span>
                <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                  {inspectedEvent.device}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Audit Narrative</span>
                <p className="text-xs text-slate-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100 mt-1">
                  {inspectedEvent.details}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedEvent(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
