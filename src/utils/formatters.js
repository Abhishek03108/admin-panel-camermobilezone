// src/utils/formatters.js

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "Rs. 0";
  
  return new Intl.NumberFormat("ne-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 2,
  }).format(amount);
};

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${name}${val > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
