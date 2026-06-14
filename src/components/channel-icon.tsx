// Small per-channel glyph so the channel reads at a glance.
export function ChannelIcon({ channel }: { channel: string }) {
  const ch = channel?.toLowerCase() ?? "";
  const common = {
    width: 13,
    height: 13,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (ch.includes("whatsapp") || ch.includes("sms"))
    return (
      <svg {...common}>
        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.4-.7L3 21l1.8-5.6a8.4 8.4 0 1 1 16.2-3.9Z" />
      </svg>
    );
  if (ch.includes("email") || ch.includes("mail"))
    return (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 6L2 7" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
