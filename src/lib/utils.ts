import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bytes(n: number) {
  if (!Number.isFinite(n)) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0,
    v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i ? 2 : 0)} ${u[i]}`;
}

function ordinal(d: number) {
  const j = d % 10,
    k = d % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export function humanDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const month = d.toLocaleString(undefined, { month: "long" });
  const day = d.getDate(),
    year = d.getFullYear();
  return `${month} ${day}${ordinal(day)} ${year}`;
}

export function ext(name: string) {
  const m = name?.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

export function isImageExt(e: string) {
  return /^(png|jpe?g|gif|bmp|webp|svg)$/i.test(e);
}
