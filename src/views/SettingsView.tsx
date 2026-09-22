import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  RefreshCw,
  Download,
  CheckCircle2,
  Lock,
  User,
  Eye,
  Server,
  Table,
  Check,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Code2,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdminUser } from '../types';
import { storageService } from '../services/storage';
import { supabaseService, getSupabaseConfigInfo, SUPABASE_RLS_FIX_SQL, SUPABASE_COLUMNS_SQL } from '../services/supabase';

interface SettingsViewProps {
  currentUser: AdminUser | null;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onResetDatabase,
}) => {
  const [resetSuccess, setResetSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    canWrite?: boolean;
    isRlsBlocked?: boolean;
    writeMessage?: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlCode, setShowSqlCode] = useState(false);
  const [copiedColsSql, setCopiedColsSql] = useState(false);
  const [showColsSql, setShowColsSql] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    running: boolean;
    result?: {
      total: number;
      synced: number;
      failed: number;
      rlsBlocked: boolean;
      errors: string[];
    };
  }>({ running: false });

  const config = getSupabaseConfigInfo();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await supabaseService.testConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncWithSupabase = async () => {
    setSyncStatus('Synchronizing...');
    try {
      await storageService.syncWithSupabase();
      setSyncStatus('Synced successfully with Supabase!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      setSyncStatus('Sync encountered an error.');
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_RLS_FIX_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyColsSql = () => {
    navigator.clipboard.writeText(SUPABASE_COLUMNS_SQL);
    setCopiedColsSql(true);
    setTimeout(() => setCopiedColsSql(false), 2500);
  };

  const handlePushLocalShipments = async () => {
    setPushStatus({ running: true });
    try {
      const res = await storageService.pushLocalShipmentsToDatabase();
      setPushStatus({ running: false, result: res });
    } catch (err: any) {
      setPushStatus({
        running: false,
        result: {
          total: 0,
          synced: 0,
          failed: 1,
          rlsBlocked: false,
          errors: [err?.message || 'Push failed'],
        },
      });
    }
  };

  const handleExportData = () => {
    const data = storageService.getShipments();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftship_shipments_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('Reset database to default initial logistics demo records?')) {
      onResetDatabase();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Portal Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          System configurations, tracking code generator rules, and Supabase database connection
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Database reset to initial demo shipments successfully!</span>
        </div>
      )}

      {/* Supabase Database Connection Card */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-[#3ECF8E]" />
            <h3>Supabase Database Integration</h3>
          </div>
          <div className="flex items-center gap-2">
            {config.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Ready to Connect (Set Keys in Settings)</span>
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Integrated with your Supabase PostgreSQL project (<span className="text-slate-300 font-medium">schema public</span>).
          All 9 tables from your database are mapped for real-time shipment tracking, visibility enforcement, and audit logs.
        </p>

        {/* Database Tables Overview */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>Configured Supabase Tables (9 detected)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {config.tables.map((tbl) => (
              <div
                key={tbl}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#171B22] border border-[#23272F] text-slate-300 font-mono text-[11px]"
              >
                <span className="truncate">{tbl}</span>
                <Check className="w-3.5 h-3.5 text-[#3ECF8E] shrink-0 ml-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Connection test result banner */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
              testResult.isRlsBlocked
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : testResult.success
                ? 'bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E]'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {testResult.isRlsBlocked ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              ) : testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3ECF8E]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.writeMessage && (
              <p className="text-[11px] opacity-90 pl-6 leading-relaxed">
                {testResult.writeMessage}
              </p>
            )}
          </div>
        )}

        {syncStatus && (
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs font-semibold text-white flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3ECF8E] ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleSyncWithSupabase}
            className="px-4 py-2 rounded-xl bg-[#3ECF8E] hover:bg-[#34B27B] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync with Supabase</span>
          </button>
        </div>
      </div>

      {/* Supabase Row-Level Security (RLS) Policy Guide Card */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-[#FFD600]" />
            <h3>Database Permissions & Row-Level Security (RLS)</h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600] font-semibold">
            One-Click SQL Fix
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-400">
          <p className="leading-relaxed">
            <strong className="text-slate-200">Why new shipments may not appear in your Supabase tables:</strong> When Row-Level Security (RLS) is enabled in Supabase without explicit <code className="text-[#FFD600] bg-[#171B22] px-1 py-0.5 rounded">INSERT</code> policies, Postgres blocks write operations with permission error code <code className="text-rose-400 font-mono text-[11px]">42501 (violates row-level security policy)</code>.
          </p>
          <div className="p-3.5 rounded-xl bg-[#171B22] border border-[#23272F] space-y-2">
            <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3ECF8E]" />
              <span>How to fix it in 30 seconds:</span>
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>Click <strong>Copy SQL Policy Script</strong> below.</li>
              <li>Open your <strong>Supabase Dashboard &rarr; SQL Editor</strong>.</li>
              <li>Paste the script into a new query tab and click <strong>Run</strong>.</li>
              <li>Come back here and click <strong>Push Local Shipments to Supabase</strong> to sync all your created records!</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleCopySql}
            className="px-4 py-2.5 rounded-xl bg-[#FFD600] hover:bg-[#E6C200] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied SQL to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2.5]" />
                <span>Copy SQL Policy Script</span>
              </>
            )}
          </button>

          <a
            href="https://supabase.com/dashboard/project/_/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs font-semibold text-white flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Open Supabase SQL Editor</span>
          </a>

          <button
            onClick={handlePushLocalShipments}
            disabled={pushStatus.running}
            className="px-4 py-2.5 rounded-xl bg-[#3ECF8E] hover:bg-[#34B27B] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <UploadCloud className={`w-4 h-4 ${pushStatus.running ? 'animate-bounce' : ''}`} />
            <span>{pushStatus.running ? 'Pushing Shipments...' : 'Push Local Shipments to Supabase'}</span>
          </button>

          <button
            onClick={() => setShowSqlCode(!showSqlCode)}
            className="px-3.5 py-2.5 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{showSqlCode ? 'Hide SQL' : 'View SQL'}</span>
            {showSqlCode ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Push Status Feedback */}
        {pushStatus.result && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              pushStatus.result.rlsBlocked
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : pushStatus.result.failed > 0
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                : 'bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E]'
            }`}
          >
            {pushStatus.result.rlsBlocked ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            ) : pushStatus.result.synced > 0 ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3ECF8E] mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block">
                {pushStatus.result.total === 0
                  ? 'All local shipments are already synced to Supabase!'
                  : pushStatus.result.rlsBlocked
                  ? `Sync Blocked by RLS: ${pushStatus.result.failed} shipment(s) could not be written.`
                  : `Sync Finished: ${pushStatus.result.synced} shipment(s) pushed to Supabase.`}
              </span>
              {pushStatus.result.rlsBlocked && (
                <p className="text-[11px] opacity-90">
                  Please execute the SQL script above in your Supabase SQL Editor, then click this button again.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Collapsible SQL preview */}
        {showSqlCode && (
          <div className="rounded-xl bg-[#0B0D11] border border-[#23272F] p-4 overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-[#1A1F29]">
              <span className="font-mono">rls_policy_fix.sql</span>
              <button
                onClick={handleCopySql}
                className="text-[#FFD600] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSql ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 p-2 leading-relaxed selection:bg-white selection:text-black">
              {SUPABASE_RLS_FIX_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* Supabase Schema Migration: Weight, Length & Width */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-[#3ECF8E]" />
            <h3>Database Schema Migration: Weight, Length & Width</h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 text-[#3ECF8E] font-semibold">
            Table Alteration SQL
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-400">
          <p className="leading-relaxed">
            To store the new optional shipment dimensions (<code className="text-[#3ECF8E] bg-[#171B22] px-1 py-0.5 rounded font-mono">weight</code>, <code className="text-[#3ECF8E] bg-[#171B22] px-1 py-0.5 rounded font-mono">length</code>, and <code className="text-[#3ECF8E] bg-[#171B22] px-1 py-0.5 rounded font-mono">width</code>) directly in your Supabase tables, run this SQL query.
          </p>
          <p className="text-[11px] text-slate-400">
            <em>Note: The app automatically detects if your table has these columns yet; if not, it saves gracefully in local memory and falls back safely without erroring.</em>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleCopyColsSql}
            className="px-4 py-2.5 rounded-xl bg-[#3ECF8E] hover:bg-[#34B27B] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            {copiedColsSql ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Copied Migration SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[2.5]" />
                <span>Copy Migration SQL</span>
              </>
            )}
          </button>

          <a
            href="https://supabase.com/dashboard/project/_/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs font-semibold text-white flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Open Supabase SQL Editor</span>
          </a>

          <button
            onClick={() => setShowColsSql(!showColsSql)}
            className="px-4 py-2.5 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{showColsSql ? 'Hide SQL Code' : 'View SQL Code'}</span>
            {showColsSql ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showColsSql && (
          <div className="rounded-xl bg-[#0B0D11] border border-[#23272F] p-4 overflow-hidden space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-[#1A1F29]">
              <span className="font-mono">add_dimensions_columns.sql</span>
              <button
                onClick={handleCopyColsSql}
                className="text-[#3ECF8E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedColsSql ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 p-2 leading-relaxed selection:bg-white selection:text-black">
              {SUPABASE_COLUMNS_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* Administrator Profile Card */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
          <User className="w-4 h-4 text-[#FFD600]" />
          <h3>Administrator Profile</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2B3240]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#FFD600] text-black font-black text-xl flex items-center justify-center">
                JA
              </div>
            )}
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#12151B]" />
          </div>

          <div className="space-y-1 text-xs">
            <h4 className="text-base font-bold text-white">{currentUser?.name || 'John Admin'}</h4>
            <p className="text-slate-400 font-mono-code">{currentUser?.email || 'admin@swiftship.com'}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-[11px] font-semibold">
              <Shield className="w-3 h-3" />
              <span>Full Administrator Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Code Algorithm Specs (Section 5, 14, 19) */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
          <Key className="w-4 h-4 text-[#FFD600]" />
          <h3>Tracking Code Specifications (Rule Mandate)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F] space-y-1">
            <span className="text-[11px] text-slate-500 block">Length Constraint</span>
            <span className="font-bold text-white text-sm">Exactly 11 Characters</span>
            <p className="text-[11px] text-slate-400">Strict fixed-width alphanumeric string</p>
          </div>

          <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F] space-y-1">
            <span className="text-[11px] text-slate-500 block">Character Set</span>
            <span className="font-bold text-white text-sm">Letters & Numbers (A-Z, 0-9)</span>
            <p className="text-[11px] text-slate-400">Unbiased random generation</p>
          </div>

          <div className="bg-[#171B22] p-4 rounded-xl border border-[#23272F] space-y-1">
            <span className="text-[11px] text-slate-500 block">Uniqueness Policy</span>
            <span className="font-bold text-emerald-400 text-sm">Strict Zero-Collision Check</span>
            <p className="text-[11px] text-slate-400">Verified against database before save</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#15181E] border border-[#262B35] text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FFD600]" />
            <span>Permanent Key Binding Architecture:</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            The tracking code does NOT embed encoded customer information. It acts purely as the permanent primary lookup index pointing to the administrator record in the shared database.
          </p>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="bg-[#12151B] border border-[#23272F] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-[#1F2937] pb-3">
          <Database className="w-4 h-4 text-[#FFD600]" />
          <h3>Database & Records Backup</h3>
        </div>

        <p className="text-xs text-slate-400">
          Export backup snapshots or reset initial records.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-[#171B22] hover:bg-[#222732] border border-[#2B313D] text-xs font-semibold text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Database (JSON)</span>
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-[#171B22] hover:bg-rose-500/10 border border-[#2B313D] hover:border-rose-500/30 text-xs font-semibold text-slate-300 hover:text-rose-400 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};

