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
  type: "customers" | "customer_profile" | "analytics" | "sales" | "proposal";
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

export const api = {
  overview: () => req<Overview>("/analytics/overview"),

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

  approve: (p: Proposal & { name?: string; goal_text?: string }) =>
    req<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(p) }),

  launch: (id: number) =>
    req<{ launched: number }>(`/campaigns/${id}/launch`, { method: "POST" }),

  campaigns: () => req<Campaign[]>("/campaigns"),
  campaign: (id: number | string) => req<CampaignDetail>(`/campaigns/${id}`),

  previewSegment: (filter: unknown) =>
    req<{ audience_count: number; sample: unknown[] }>("/segments/preview", {
      method: "POST",
      body: JSON.stringify({ filter }),
    }),
};
