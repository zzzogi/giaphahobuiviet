"use client";

import { Person } from "@/libs/familyData";
import { computeTreeStats } from "@/libs/stats";
import { useMemo } from "react";

interface Props {
  treeData: Person | null | undefined;
}

export default function StatsPanel({ treeData }: Props) {
  const stats = useMemo(() => computeTreeStats(treeData), [treeData]);

  if (!treeData) return null;

  return (
    <div className="flex items-center gap-3 bg-white/90 backdrop-blur rounded-xl shadow px-3 py-2 text-xs w-max z-40">
      <StatItem label="Tổng" value={stats.total} />
      <div className="w-px h-4 bg-slate-200" />
      <StatItem label="Nam" value={stats.males} color="text-blue-600" />
      <div className="w-px h-4 bg-slate-200" />
      <StatItem label="Nữ" value={stats.females} color="text-rose-500" />
      <div className="w-px h-4 bg-slate-200" />
      <StatItem
        label="Đời"
        value={stats.generations}
        color="text-emerald-600"
      />
    </div>
  );
}

function StatItem({
  label,
  value,
  color = "text-slate-700",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
