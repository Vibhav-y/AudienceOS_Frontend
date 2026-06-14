// Thin typed client for the AudienceOS backend.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `request failed (${res.status})`);
  return body as T;
}

export interface Proposal {
  segment_name: string;
  filter: unknown;
  channel: string;
  channel_reason: string;
  message: string;
  projected_reach_note: string;
  audience_count: number;
  projected_delivered: number;
  // Set when the proposal has already been saved as a draft campaign.
  campaign_id?: number | null;
  // Coupon the copy uses (null when the campaign has no discount) and the
  // full list, so the card can offer a swap without another agent turn.
  coupon_code?: string | null;
  coupons?: Coupon[];
}
export interface TraceStep {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
}
export interface AgentRun {
  proposal: Proposal;
  trace: TraceStep[];
}

export interface Campaign {
  id: number;
  name: string;
  channel: string;
  message: string;
  status: string;
  goal_text?: string;
  audience_count?: number;
  created_at?: string;
  // Rollups from the list endpoint (0 until the campaign has been launched).
  sent?: number;
  delivered?: number;
  converted?: number;
  revenue?: number;
}
export interface CampaignDetail extends Campaign {
  funnel: { stage: string; n: number }[];
  failed: number;
  attributed_orders: number;
  attributed_revenue: number;
  duplicates: number;
  out_of_order: number;
}

export interface Pipeline {
  events: number;
  duplicates: number;
  out_of_order: number;
  channel_up: boolean;
  queue_depth: number;
  dead_letters: number;
}

export interface Overview {
  pipeline: Pipeline;
  base: { customers: number; orders: number; campaigns: number };
  funnel: { stage: string; n: number }[];
  failed: number;
  attributed_orders: number;
  attributed_revenue: number;
  by_channel: { channel: string; sent: number; delivered: number; converted: number; revenue: number }[];
  recent: {
    id: number; name: string; channel: string; status: string;
    audience_count: number; sent: number; delivered: number; converted: number; revenue: number;
  }[];
}

export interface ChatArtifact {
  type: "customers" | "customer_profile" | "analytics" | "sales" | "proposal" | "coupon_picker";
  [k: string]: unknown;
}
export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  data?: { artifacts?: ChatArtifact[]; trace?: { tool: string; args: unknown }[] };
}
export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}
export interface AssistantTurn {
  content: string;
  artifacts: ChatArtifact[];
  trace: { tool: string; args: unknown }[];
}

export interface AppSettings {
  dormant_days: number;
  high_value_spend: number;
  loyal_order_count: number;
  updated_at?: string;
}

// Ingestion payloads — mirror the backend /ingest schemas exactly.
export interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  age: number;
  city: string;
  state?: string;
  country?: string;
  address?: string;
}
export interface OrderInput {
  customer_id?: number;
  customer_email?: string;
  amount: number;
  category: string;
  order_date?: string;
  external_id?: string;
}
export interface Coupon {
  id: number;
  code: string;
  kind: "percent" | "flat";
  value: number;
  description: string | null;
  created_at?: string;
}
export interface CouponInput {
  code: string;
  kind: "percent" | "flat";
  value: number;
  description?: string;
}

export interface Insights {
  trend: { day: string; orders: number; revenue: number; attributed_revenue: number }[];
  coupons: {
    code: string;
    kind: "percent" | "flat";
    value: number;
    sent: number;
    converted: number;
    revenue: number;
  }[];
  top_customers: {
    id: number;
    name: string;
    city: string | null;
    total_spent: number;
    order_count: number;
    last_order_date: string | null;
  }[];
  segments: {
    thresholds: { dormant_days: number; high_value_spend: number; loyal_order_count: number };
    dormant: number;
    high_value: number;
    loyal: number;
    never_ordered: number;
  };
  heatmap: { dow: number; hour: number; n: number }[];
}

export interface IngestCustomersResult { ingested: number; created: number; updated: number }
export interface IngestOrdersResult { ingested: number; deduplicated: number }

// The backend caps each request at 1000 rows, so split large batches and
// accumulate the per-chunk results into one summary.
const IMPORT_CHUNK = 1000;
function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export const api = {
  overview: () => req<Overview>("/analytics/overview"),
  insights: () => req<Insights>("/analytics/insights"),

  settings: () => req<AppSettings>("/settings"),

  coupons: () => req<Coupon[]>("/coupons"),
  addCoupon: (c: CouponInput) =>
    req<Coupon>("/coupons", { method: "POST", body: JSON.stringify(c) }),
  deleteCoupon: (id: number) =>
    req<{ deleted: boolean }>(`/coupons/${id}`, { method: "DELETE" }),
  saveSettings: (patch: Partial<AppSettings>) =>
    req<AppSettings>("/settings", { method: "PUT", body: JSON.stringify(patch) }),

  // Ingest a batch of customers, chunked to the backend's 1000-row limit.
  // Results are summed across chunks. A failing chunk rejects (its row-level
  // error message is surfaced to the caller).
  ingestCustomers: async (rows: CustomerInput[]): Promise<IngestCustomersResult> => {
    const acc: IngestCustomersResult = { ingested: 0, created: 0, updated: 0 };
    for (const part of chunk(rows, IMPORT_CHUNK)) {
      const r = await req<IngestCustomersResult>("/ingest/customers", {
        method: "POST",
        body: JSON.stringify(part),
      });
      acc.ingested += r.ingested; acc.created += r.created; acc.updated += r.updated;
    }
    return acc;
  },
  ingestOrders: async (rows: OrderInput[]): Promise<IngestOrdersResult> => {
    const acc: IngestOrdersResult = { ingested: 0, deduplicated: 0 };
    for (const part of chunk(rows, IMPORT_CHUNK)) {
      const r = await req<IngestOrdersResult>("/ingest/orders", {
        method: "POST",
        body: JSON.stringify(part),
      });
      acc.ingested += r.ingested; acc.deduplicated += r.deduplicated;
    }
    return acc;
  },

  chatSessions: () => req<ChatSession[]>("/chat/sessions"),
  newChatSession: () => req<{ id: number }>("/chat/sessions", { method: "POST" }),
  chatMessages: (id: number) => req<ChatMessage[]>(`/chat/sessions/${id}`),
  sendChat: (id: number, content: string) =>
    req<AssistantTurn>(`/chat/sessions/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Streaming send: calls onStep for each live tool step, resolves with the turn.
  sendChatStream: async (
    id: number,
    content: string,
    onStep: (tool: string) => void,
  ): Promise<AssistantTurn> => {
    const res = await fetch(`${BASE}/chat/sessions/${id}/stream`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok || !res.body) throw new Error(`request failed (${res.status})`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let turn: AssistantTurn | null = null;
    let err: string | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        let event = "message";
        let data = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (event === "step") {
          try { onStep(JSON.parse(data).tool); } catch {}
        } else if (event === "done") {
          turn = JSON.parse(data) as AssistantTurn;
        } else if (event === "error") {
          err = data || "assistant failed to respond";
        }
      }
    }
    if (err) throw new Error(err);
    if (!turn) throw new Error("no response from assistant");
    return turn;
  },

  propose: (goal: string) =>
    req<AgentRun>("/agent/propose", { method: "POST", body: JSON.stringify({ goal }) }),

  approve: (p: Proposal & { name?: string; goal_text?: string; status?: "approved" | "draft" }) =>
    req<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(p) }),

  launch: (id: number) =>
    req<{ launched: number }>(`/campaigns/${id}/launch`, { method: "POST" }),

  // Save edits to an existing draft (channel/message/name) from the chat card.
  saveDraft: (id: number, patch: { channel?: string; message?: string; name?: string }) =>
    req<Campaign>(`/campaigns/${id}/draft`, { method: "PUT", body: JSON.stringify(patch) }),

  campaigns: () => req<Campaign[]>("/campaigns"),
  campaign: (id: number | string) => req<CampaignDetail>(`/campaigns/${id}`),

  previewSegment: (filter: unknown) =>
    req<{ audience_count: number; sample: unknown[] }>("/segments/preview", {
      method: "POST",
      body: JSON.stringify({ filter }),
    }),
};
