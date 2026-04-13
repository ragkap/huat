"use client";

import { useState } from "react";
import { stripHtml } from "@/lib/smartkarma/primer";

interface Props {
  company_overview: string[];
  industry_overview: string[];
  competitive_landscape: string[];
}

function OverviewWidget({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  return (
    <div className="border border-[#282828] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{title}</p>
        <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
      </div>
      <ul className="space-y-2">
        {(expanded ? items : items.slice(0, 1)).map((point, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[#555555] flex-shrink-0 mt-0.5">·</span>
            <span className="text-xs text-[#C0C0C0] leading-relaxed">{stripHtml(point)}</span>
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors"
        >
          {expanded ? "Show less" : `Show ${items.length - 1} more`}
        </button>
      )}
    </div>
  );
}

export function PrimerLeftPanel({ company_overview, industry_overview, competitive_landscape }: Props) {
  const hasAny = company_overview.length || industry_overview.length || competitive_landscape.length;
  if (!hasAny) return null;

  return (
    <aside className="w-64 flex-shrink-0 hidden xl:block border-r border-[#282828]">
      <div className="sticky top-20 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-6rem)]">
        <OverviewWidget title="Company Overview" items={company_overview} />
        <OverviewWidget title="Industry Overview" items={industry_overview} />
        <OverviewWidget title="Competitive Landscape" items={competitive_landscape} />
      </div>
    </aside>
  );
}
