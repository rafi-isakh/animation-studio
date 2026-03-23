"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetricSeries {
  total: number;
  series: { timestamp: string; value: number }[];
}

interface MetricsData {
  reads: MetricSeries;
  writes: MetricSeries;
  deletes: MetricSeries;
}

interface ChartPoint {
  label: string;
  reads: number;
  writes: number;
  deletes: number;
}

type RangeKey = "60m" | "6h" | "24h" | "7d";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RANGE_PRESETS: { label: string; key: RangeKey }[] = [
  { label: "1 hour", key: "60m" },
  { label: "6 hours", key: "6h" },
  { label: "Today", key: "24h" },
  { label: "7 days", key: "7d" },
];

const METRIC_META = {
  reads: { label: "Reads", color: "#3B82F6" },
  writes: { label: "Writes", color: "#F59E0B" },
  deletes: { label: "Deletes", color: "#EF4444" },
} as const;

type MetricKey = keyof typeof METRIC_META;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatTimestamp(iso: string, rangeKey: RangeKey): string {
  const d = new Date(iso);
  if (rangeKey === "60m" || rangeKey === "6h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function buildChartData(data: MetricsData, rangeKey: RangeKey): ChartPoint[] {
  // Build a map from timestamp → values
  const map = new Map<string, ChartPoint>();

  const add = (series: MetricSeries["series"], key: MetricKey) => {
    for (const pt of series) {
      if (!map.has(pt.timestamp)) {
        map.set(pt.timestamp, { label: formatTimestamp(pt.timestamp, rangeKey), reads: 0, writes: 0, deletes: 0 });
      }
      map.get(pt.timestamp)![key] = pt.value;
    }
  };

  add(data.reads.series, "reads");
  add(data.writes.series, "writes");
  add(data.deletes.series, "deletes");

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function CustomTooltip({
  active,
  payload,
  label,
  visible,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  visible: Record<MetricKey, boolean>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#211F21] border border-[#272727] rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-2">{label}</p>
      {(["reads", "writes", "deletes"] as MetricKey[])
        .filter((k) => visible[k])
        .map((k) => {
          const entry = payload.find((p) => p.name === k);
          if (!entry) return null;
          return (
            <div key={k} className="flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: METRIC_META[k].color }}
              />
              <span className="text-gray-300">{METRIC_META[k].label}:</span>
              <span className="text-[#E8E8E8] font-medium">
                {entry.value.toLocaleString()}
              </span>
            </div>
          );
        })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DatabaseUsagePage() {
  const [activeRange, setActiveRange] = useState<RangeKey>("60m");
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    reads: true,
    writes: true,
    deletes: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      if (data) {
        setRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/monitoring?range=${activeRange}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch metrics");
        }
        if (!cancelled) setData(json as MetricsData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefetching(false);
        }
      }
    }

    fetchMetrics();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRange]);

  const chartData = data ? buildChartData(data, activeRange) : [];

  return (
    <div className="px-12 pb-8">
      {/* Header row */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#E8E8E8]">
            Usage Metrics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Database operation counts over time.
          </p>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-1 p-1 bg-[#211F21] border border-[#272727] rounded-lg">
          {RANGE_PRESETS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setActiveRange(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeRange === key
                  ? "bg-[#DB2777] text-white hover:bg-[#BE185D]"
                  : "text-gray-400 hover:text-[#E8E8E8]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["reads", "writes", "deletes"] as MetricKey[]).map((key) => {
          const meta = METRIC_META[key];
          const total = data?.[key]?.total ?? 0;
          return (
            <div
              key={key}
              className="flex flex-col gap-3 p-6 bg-[#211F21] border border-[#272727] rounded-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                  {meta.label}
                </span>
                {/* Checkbox toggle */}
                <button
                  onClick={() =>
                    setVisible((v) => ({ ...v, [key]: !v[key] }))
                  }
                  className="flex items-center gap-1.5 group"
                  aria-label={`Toggle ${meta.label}`}
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center border transition-colors"
                    style={
                      visible[key]
                        ? { backgroundColor: meta.color, borderColor: meta.color }
                        : { borderColor: "#272727" }
                    }
                  >
                    {visible[key] && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className="text-4xl font-bold tracking-tight"
                  style={{ color: meta.color }}
                >
                  {loading ? "—" : formatCount(total)}
                </span>
                <span className="text-sm text-gray-500">total</span>
              </div>

              {/* Color bar */}
              <div className="h-1 bg-[#1A1A1C] rounded-full">
                <div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: meta.color, width: visible[key] ? "100%" : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart card */}
      <div className="bg-[#211F21] border border-[#272727] rounded-xl">
        <div className="px-6 py-5 border-b border-[#272727]">
          <span className="text-[15px] font-semibold text-[#E8E8E8]">
            Operations per{" "}
            {activeRange === "60m"
              ? "minute"
              : activeRange === "6h"
              ? "5 minutes"
              : activeRange === "24h"
              ? "15 minutes"
              : "hour"}
          </span>
        </div>

        <div
          className={`px-6 py-6 transition-opacity duration-200 ${refetching ? "opacity-50" : "opacity-100"}`}
        >
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="w-8 h-8 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#272727" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={{ stroke: "#272727" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCount(v)}
                  width={48}
                />
                <Tooltip
                  content={<CustomTooltip visible={visible} />}
                  cursor={{ stroke: "#272727", strokeWidth: 1 }}
                />
                {(["reads", "writes", "deletes"] as MetricKey[]).map((key) =>
                  visible[key] ? (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={METRIC_META[key].color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: METRIC_META[key].color }}
                    />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
