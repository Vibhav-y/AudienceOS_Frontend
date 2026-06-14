// Shared formatters so money and dates render identically everywhere.

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const num = (n: number | null | undefined) => (n ?? 0).toLocaleString();

export const dateShort = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
