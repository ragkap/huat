import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null, currency = "SGD"): string {
  if (price === null) return "--";
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(price);
}

export function formatChange(change: number | null, pct: number | null): string {
  if (change === null || pct === null) return "--";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(3)} (${sign}${pct.toFixed(2)}%)`;
}

// n is in USD millions (as returned by Smartkarma market_value_usd)
export function formatMarketCap(n: number | null): string {
  if (n === null) return "--";
  if (n >= 1e6) return `US$${(n / 1e6).toFixed(2)}T`;
  if (n >= 1e3) return `US$${(n / 1e3).toFixed(2)}B`;
  return `US$${n.toFixed(0)}M`;
}

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

export function timeLeft(date: string | Date): string {
  const diff = Math.floor((new Date(date).getTime() - Date.now()) / 1000);
  if (diff <= 0) return "ended";
  if (diff < 3600) return `${Math.ceil(diff / 60)}m left`;
  if (diff < 86400) return `${Math.ceil(diff / 3600)}h left`;
  const days = Math.ceil(diff / 86400);
  return `${days}d left`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

export function ripple(e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  let x = rect.width / 2;
  let y = rect.height / 2;
  if ("clientX" in e && (e.clientX || e.clientY)) {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  } else if ("touches" in e && e.touches.length) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  }
  const span = document.createElement("span");
  const sz = Math.max(rect.width, rect.height) * 2;
  span.style.cssText = `position:absolute;border-radius:50%;transform:scale(0);animation:btn-ripple 400ms ease-out forwards;pointer-events:none;z-index:0;width:${sz}px;height:${sz}px;left:${x - sz / 2}px;top:${y - sz / 2}px;background:currentColor;opacity:0.2;`;
  el.appendChild(span);
  setTimeout(() => span.remove(), 500);
}
