"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, LayoutDashboard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { stripHtml } from "@/lib/smartkarma/primer";
import { RHSWidgetsClient } from "@/components/stock/rhs-widgets-client";
import type { StockPrimer } from "@/lib/smartkarma/primer";
import type { SmartScore } from "@/lib/smartkarma/client";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
];

interface PrimerOverview {
  company_overview: string[];
  industry_overview: string[];
  competitive_landscape: string[];
  management: string[];
  key_products_and_services: string[];
}

function OverviewWidget({ title, items }: { title: string; items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const text = items.map(p => stripHtml(p)).join("\n\n");
  return (
    <div className="widget-hover border border-[#282828] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">{title}</p>
        <a href="https://www.smartkarma.com/home/smartwealth/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#555555] hover:text-[#9CA3AF] transition-colors">by Smartkarma</a>
      </div>
      <p
        className="widget-text-muted text-xs text-[#9CA3AF] leading-relaxed whitespace-pre-line"
        style={expanded ? undefined : { display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {text}
      </p>
      <button
        onClick={() => setExpanded(e => !e)}
        className="mt-2 text-[11px] text-[#71717A] hover:text-[#F0F0F0] transition-colors"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

interface StockPanelData {
  primer: PrimerOverview | null;
  rhsPrimer: StockPrimer | null;
  rhsSmartScore: SmartScore | null;
  rhsStatus: "success" | "enqueued" | "error";
}

function useStockPanelData(ticker: string | null): StockPanelData {
  const [data, setData] = useState<StockPanelData>({
    primer: null,
    rhsPrimer: null,
    rhsSmartScore: null,
    rhsStatus: "error",
  });

  useEffect(() => {
    if (!ticker) return;
    setData({ primer: null, rhsPrimer: null, rhsSmartScore: null, rhsStatus: "error" });

    fetch(`/api/stocks/${encodeURIComponent(ticker)}/primer`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setData({
          primer: d.primer ? {
            company_overview: d.primer.company_overview ?? [],
            industry_overview: d.primer.industry_overview ?? [],
            competitive_landscape: d.primer.competitive_landscape ?? [],
            management: d.primer.management ?? [],
            key_products_and_services: d.primer.key_products_and_services ?? [],
          } : null,
          rhsPrimer: d.primer ?? null,
          rhsSmartScore: null, // SmartScore not available client-side here
          rhsStatus: (d.status as "success" | "enqueued" | "error") ?? "error",
        });
      })
      .catch(() => null);
  }, [ticker]);

  return data;
}

function StockDrawer({ ticker, onClose }: { ticker: string; onClose: () => void }) {
  const data = useStockPanelData(ticker);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on backdrop tap
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        ref={drawerRef}
        className="w-full bg-[#0A0A0A] border-t border-[#282828] rounded-t-2xl max-h-[85vh] flex flex-col"
        style={{ animation: "slideUp 220ms ease-out" }}
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="w-10 h-1 bg-[#333333] rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Analysis</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-3">
          {/* RHS widgets (Ratings, SmartScore, Porters, etc.) */}
          <RHSWidgetsClient
            ticker={ticker}
            initialStatus={data.rhsStatus}
            initialPrimer={data.rhsPrimer}
            smartScore={data.rhsSmartScore}
          />

          {/* LHS overview widgets */}
          {data.primer && (
            <>
              <OverviewWidget title="Company Overview" items={data.primer.company_overview} />
              <OverviewWidget title="Industry Overview" items={data.primer.industry_overview} />
              <OverviewWidget title="Products & Services" items={data.primer.key_products_and_services} />
              <OverviewWidget title="Competitive Landscape" items={data.primer.competitive_landscape} />
              <OverviewWidget title="Management" items={data.primer.management} />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StockSidebarWidgets({ ticker }: { ticker: string }) {
  const [primer, setPrimer] = useState<PrimerOverview | null>(null);

  useEffect(() => {
    setPrimer(null);
    fetch(`/api/stocks/${encodeURIComponent(ticker)}/primer`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.primer) {
          setPrimer({
            company_overview: data.primer.company_overview ?? [],
            industry_overview: data.primer.industry_overview ?? [],
            competitive_landscape: data.primer.competitive_landscape ?? [],
            management: data.primer.management ?? [],
            key_products_and_services: data.primer.key_products_and_services ?? [],
          });
        }
      })
      .catch(() => null);
  }, [ticker]);

  if (!primer) return null;

  return (
    <div className="mt-4 space-y-2">
      <OverviewWidget title="Company Overview" items={primer.company_overview} />
      <OverviewWidget title="Industry Overview" items={primer.industry_overview} />
      <OverviewWidget title="Products & Services" items={primer.key_products_and_services} />
      <OverviewWidget title="Competitive Landscape" items={primer.competitive_landscape} />
      <OverviewWidget title="Management" items={primer.management} />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Extract ticker from /stocks/[ticker]
  const stockMatch = pathname.match(/^\/stocks\/([^/]+)/);
  const stockTicker = stockMatch ? decodeURIComponent(stockMatch[1]) : null;

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)] w-80 flex-shrink-0 border-r border-[#282828] flex-col pt-3 pb-6 px-4 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors",
                  active
                    ? "text-[#F0F0F0] bg-[#282828]"
                    : "text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#141414]"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {stockTicker && <StockSidebarWidgets ticker={stockTicker} />}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#282828] flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                active ? "text-[#F0F0F0]" : "text-[#555555]"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* FAB — only on stock pages, mobile only (below xl) */}
      {stockTicker && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="xl:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#E8311A] text-white flex items-center justify-center shadow-lg shadow-black/50 transition-transform active:scale-95"
          aria-label="Show analysis"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
      )}

      {/* Bottom drawer */}
      {drawerOpen && stockTicker && (
        <StockDrawer ticker={stockTicker} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}
