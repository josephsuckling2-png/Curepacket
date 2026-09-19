import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function daysUntil(date: Date | string | null | undefined) {
  if (!date) return null;
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toCsvLines(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

export function originOf(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function normalizeUrl(url: string, base?: string) {
  try {
    const parsed = new URL(url, base);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
