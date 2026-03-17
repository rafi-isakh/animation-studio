"use client";

import { useEffect, useState, useRef } from "react";
import { useMithrilAuth } from "./auth/MithrilAuthContext";
import { listProjects } from "./services/firestore/projects";
import type { ProjectMetadata } from "./services/firestore/types";
import MithrilHeader from "./MithrilHeader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserSummary {
  user_id: string;
  total_used_usd: number;
  transaction_count: number;
}

interface StageEntry {
  job_type: string;
  total_usd: number;
  call_count: number;
}

interface ProviderEntry {
  provider_id: string;
  total_usd: number;
  call_count: number;
}

// Provider display config: colors + short labels for known providers
const PROVIDER_META: Record<string, { label: string; abbr: string; color: string }> = {
  veo3:              { label: "Veo 3",    abbr: "V3", color: "#DB2777" },
  sora:              { label: "Sora",     abbr: "So", color: "#3B82F6" },
  gemini:            { label: "Gemini",   abbr: "Ge", color: "#8B5CF6" },
  grok:              { label: "Grok",     abbr: "Gr", color: "#F59E0B" },
  grok_i2v:          { label: "Grok I2V", abbr: "Gk", color: "#F97316" },
  grok_imagine_i2v:  { label: "Grok Img", abbr: "Gi", color: "#EF4444" },
  wan_i2v:           { label: "Wan I2V",  abbr: "Wn", color: "#10B981" },
  wan22_i2v:         { label: "Wan 2.2",  abbr: "W2", color: "#14B8A6" },
  pixai:             { label: "PixAI",    abbr: "Px", color: "#EC4899" },
  z_image_turbo:     { label: "Z-Turbo",  abbr: "ZT", color: "#A78BFA" },
};

const STAGE_COLORS = [
  "#DB2777", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#10B981", "#EC4899", "#F97316", "#14B8A6",
  "#EF4444", "#A78BFA", "#6366F1", "#84CC16",
];

function providerMeta(id: string) {
  return PROVIDER_META[id] ?? {
    label: id,
    abbr: id.slice(0, 2).toUpperCase(),
    color: "#6B7280",
  };
}

// ---------------------------------------------------------------------------
// Date range presets
// ---------------------------------------------------------------------------

const PRESETS = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 0 },
] as const;

function startOfDayUtc(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Format a local YYYY-MM-DD date string as a UTC ISO string (start of day). */
function localDateToStartIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toISOString();
}

/** Format a local YYYY-MM-DD date string as a UTC ISO string (end of day). */
function localDateToEndIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59Z`).toISOString();
}

/** Today as YYYY-MM-DD for the date input max attribute. */
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

async function fetchCredits(type: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ type, ...params });
  const res = await fetch(`/api/credits?${qs}`);
  if (!res.ok) throw new Error(`Credits fetch failed (${type}): ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreditsPage() {
  const { user } = useMithrilAuth();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [stages, setStages] = useState<StageEntry[]>([]);
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [loading, setLoading] = useState(true);   // true only on first mount
  const [refetching, setRefetching] = useState(false); // true on filter changes
  const [error, setError] = useState<string | null>(null);

  // Preset filter (days=0 means all-time)
  const [activeDays, setActiveDays] = useState<number>(30);

  // Custom range state
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  // Committed custom range (null = not active)
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  // Load projects for filter dropdown
  useEffect(() => {
    if (!user) return;
    listProjects({ id: user.id, role: user.role }).then(setProjects).catch(() => {});
  }, [user]);

  const fromRef = useRef<HTMLInputElement>(null);

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    setCustomRange({ from: customFrom, to: customTo });
  }

  function clearCustomRange() {
    setCustomRange(null);
    setCustomFrom("");
    setCustomTo("");
    setShowCustom(false);
  }

  // Build date params for fetch — custom range takes priority over preset
  function buildDateParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (selectedProjectId) params.project_id = selectedProjectId;
    if (customRange) {
      params.start_date = localDateToStartIso(customRange.from);
      params.end_date = localDateToEndIso(customRange.to);
      return params;
    }
    if (activeDays > 0) params.start_date = startOfDayUtc(activeDays);
    return params;
  }

  const isFirstFetch = useRef(true);

  useEffect(() => {
    let cancelled = false;

    if (isFirstFetch.current) {
      setLoading(true);
    } else {
      setRefetching(true);
    }
    setError(null);

    const dateParams = buildDateParams();

    Promise.all([
      fetchCredits("summary", dateParams),
      fetchCredits("stages", dateParams),
      fetchCredits("providers", dateParams),
    ])
      .then(([summaryData, stagesData, providersData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setStages(stagesData.stages ?? []);
        setProviders(providersData.providers ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
          isFirstFetch.current = false;
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDays, customRange, selectedProjectId]);

  // Derived category totals
  const videoUsd = providers
    .filter((p) => ["veo3", "sora", "grok_i2v", "grok_imagine_i2v", "wan_i2v", "wan22_i2v"].includes(p.provider_id))
    .reduce((s, p) => s + p.total_usd, 0);
  const imageUsd = providers
    .filter((p) => ["gemini", "grok", "z_image_turbo", "pixai"].includes(p.provider_id))
    .reduce((s, p) => s + p.total_usd, 0);
  const totalUsd = summary?.total_used_usd ?? 0;
  const textUsd = Math.max(0, totalUsd - videoUsd - imageUsd);

  const maxProviderCost = providers[0]?.total_usd ?? 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <span className="text-gray-500 text-sm">Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <span className="text-red-400 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E8E8E8] flex flex-col">
      <MithrilHeader />
      <div className={`flex flex-col flex-1 pt-16 transition-opacity duration-200 ${refetching ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
      {/* Page header */}
      <div className="flex items-center justify-between px-12 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Credits Usage</h1>
          <p className="text-sm text-gray-500">Track your AI provider costs across all projects</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 bg-[#211F21] border border-[#272727] rounded-lg text-sm text-[#E8E8E8] outline-none cursor-pointer"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {/* Preset pills */}
          <div className="flex items-center gap-1 p-1 bg-[#211F21] border border-[#272727] rounded-lg">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setActiveDays(p.days); clearCustomRange(); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !customRange && activeDays === p.days
                    ? "bg-[#DB2777] text-white"
                    : "text-gray-400 hover:text-[#E8E8E8]"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => { setShowCustom((v) => !v); setTimeout(() => fromRef.current?.focus(), 50); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                customRange
                  ? "bg-[#DB2777] text-white"
                  : "text-gray-400 hover:text-[#E8E8E8]"
              }`}
            >
              {customRange ? `${customRange.from} → ${customRange.to}` : "Custom"}
            </button>
          </div>

          {/* Custom date inputs — shown inline when Custom is open */}
          {showCustom && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#211F21] border border-[#272727] rounded-lg">
              <input
                ref={fromRef}
                type="date"
                value={customFrom}
                max={customTo || todayString()}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-transparent text-sm text-[#E8E8E8] outline-none [color-scheme:dark] cursor-pointer"
              />
              <span className="text-gray-600 text-sm">→</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayString()}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-transparent text-sm text-[#E8E8E8] outline-none [color-scheme:dark] cursor-pointer"
              />
              <button
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
                className="px-3 py-1 bg-[#DB2777] disabled:opacity-40 text-white text-xs font-medium rounded-md transition-opacity"
              >
                Apply
              </button>
              {customRange && (
                <button
                  onClick={clearCustomRange}
                  className="text-gray-500 hover:text-[#E8E8E8] text-xs transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 px-12">
        <StatCard
          label="Total Spend"
          value={fmt(totalUsd)}
          sub={`${(summary?.transaction_count ?? 0).toLocaleString()} API calls`}
        />
        <StatCard
          label="Video Generation"
          value={fmt(videoUsd)}
          sub={totalUsd > 0 ? `${Math.round((videoUsd / totalUsd) * 100)}% of total` : "—"}
          accent
        />
        <StatCard
          label="Image Generation"
          value={fmt(imageUsd)}
          sub={totalUsd > 0 ? `${Math.round((imageUsd / totalUsd) * 100)}% of total` : "—"}
        />
        <StatCard
          label="Text & Multimodal"
          value={fmt(textUsd)}
          sub={totalUsd > 0 ? `${Math.round((textUsd / totalUsd) * 100)}% of total` : "—"}
        />
      </div>

      {/* Main panels */}
      <div className="flex gap-4 px-12 py-6 flex-1">
        {/* Provider breakdown */}
        <div className="flex-1 bg-[#211F21] border border-[#272727] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#272727]">
            <span className="text-[15px] font-semibold">Cost by Provider</span>
            <span className="text-sm text-gray-500">{providers.length} providers</span>
          </div>
          {providers.length === 0 ? (
            <EmptyState label="No provider data yet" />
          ) : (
            <div className="flex flex-col">
              {providers.map((p, i) => {
                const meta = providerMeta(p.provider_id);
                const barPct = Math.round((p.total_usd / maxProviderCost) * 100);
                return (
                  <div
                    key={p.provider_id}
                    className={`flex items-center gap-4 px-6 py-3.5 ${i < providers.length - 1 ? "border-b border-[#1A1A1C]" : ""}`}
                  >
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 text-xs font-bold text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.abbr}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <div className="h-1 bg-[#1A1A1C] rounded-full w-full">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0 w-20">
                      <span className="text-sm font-semibold">{fmt(p.total_usd)}</span>
                      <span className="text-xs text-gray-500">{p.call_count} calls</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stage breakdown */}
        <div className="flex-1 bg-[#211F21] border border-[#272727] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#272727]">
            <span className="text-[15px] font-semibold">Cost by Stage</span>
            <span className="text-sm text-gray-500">{stages.length} stages</span>
          </div>
          {stages.length === 0 ? (
            <EmptyState label="No stage data yet" />
          ) : (
            <div className="flex flex-col">
              {stages.map((s, i) => (
                <div
                  key={s.job_type}
                  className={`flex items-center gap-4 px-6 py-3.5 ${i < stages.length - 1 ? "border-b border-[#1A1A1C]" : ""}`}
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                  </div>
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="text-sm font-medium capitalize">{s.job_type.replace(/_/g, " ")}</span>
                    <span className="text-xs text-gray-500">{s.call_count} calls</span>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0 w-16 text-right">{fmt(s.total_usd)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-6 bg-[#211F21] border border-[#272727] rounded-xl">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`text-4xl font-bold tracking-tight ${accent ? "text-[#DB2777]" : "text-[#E8E8E8]"}`}>
        {value}
      </span>
      <span className="text-sm text-gray-500">{sub}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
