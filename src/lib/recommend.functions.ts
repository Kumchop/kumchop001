import { createServerFn } from "@tanstack/react-start";
import { menuItems, money } from "./menu";

export const AVOID_OPTIONS = [
  "Peanuts & nuts",
  "Dairy & milk",
  "Eggs",
  "Gluten & wheat",
  "Fish & seafood",
  "Pork",
  "Beef",
  "All meat (vegetarian)",
  "Very spicy food",
] as const;
export type AvoidOption = (typeof AVOID_OPTIONS)[number];

export type Recommendation = { id: string; reason: string };
export type RecommendResult = { picks: Recommendation[]; note: string; error?: string };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["picks", "note"],
  properties: {
    note: { type: "string" },
    picks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "reason"],
        properties: { id: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

export const recommendDishes = createServerFn({ method: "POST" })
  .inputValidator((d: { craving: string; avoid?: string[] }) => {
    const craving = String(d?.craving ?? "")
      .trim()
      .slice(0, 500);
    const avoid = (Array.isArray(d?.avoid) ? d.avoid : []).filter((a): a is AvoidOption =>
      (AVOID_OPTIONS as readonly string[]).includes(a),
    );
    if (craving.length < 2 && avoid.length === 0)
      throw new Error("Tell us a little about what you feel like eating.");
    return { craving: craving || "Anything good", avoid };
  })
  .handler(async ({ data }): Promise<RecommendResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { picks: [], note: "", error: "Recommendations are not available right now." };
    const available = menuItems.filter((i) => !i.soldOut);
    const menuText = available
      .map((i) => `${i.id} | ${i.name} | ${i.categories.join(", ")} | ${money(i.priceKobo)}`)
      .join("\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          'You are a friendly food guide for Kumchop, a restaurant in Akungba Akoko, Nigeria. Recommend 1 to 4 dishes ONLY from the menu list given (use the exact id). Never invent dishes, ingredients, or allergy guarantees; only names, categories and prices are known. If the customer lists things to avoid, leave out any dish whose name or category suggests it may contain them (e.g. milk shake = dairy, pie/bread/spag/pasta = gluten, fish/croaker = seafood, asun/suya/chicken/beef = meat); when unsure, leave it out. Never claim a dish is free of anything; reasons may only say a dish may suit the need and must be confirmed with Kumchop. Keep each reason under 25 words. "note" is one short friendly sentence.',
        input: `Menu (id | name | categories | price):\n${menuText}\n\nCustomer request: ${data.craving}${data.avoid.length ? `\nMust avoid: ${data.avoid.join(", ")}` : ""}`,
        text: { format: { type: "json_schema", name: "recommendations", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error(`AI gateway failed [${res.status}]: ${body}`);
      const msg =
        res.status === 429
          ? "Lots of people are asking right now — please try again in a moment."
          : res.status === 402
            ? "Recommendations are paused for now. Please browse the menu instead."
            : "We could not get recommendations right now. Please try again.";
      return { picks: [], note: "", error: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "",
      text = "",
      refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") refused = true;
        } catch {
          /* partial */
        }
      }
    }
    if (refused || !text)
      return { picks: [], note: "", error: "We could not suggest dishes for that request." };
    try {
      const parsed = JSON.parse(text) as RecommendResult;
      const ids = new Set(available.map((i) => i.id));
      return { note: parsed.note, picks: parsed.picks.filter((p) => ids.has(p.id)).slice(0, 4) };
    } catch {
      return { picks: [], note: "", error: "We could not read the suggestions. Please try again." };
    }
  });
