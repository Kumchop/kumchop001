import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { findItem, money } from "@/lib/menu";
import { useCart } from "./cart";
import {
  recommendDishes,
  AVOID_OPTIONS,
  type AvoidOption,
  type RecommendResult,
} from "@/lib/recommend.functions";

const examples = [
  "Something spicy with rice",
  "Light and no meat",
  "A cold sweet treat",
  "Big meal under ₦5,000",
];

export function CravingFinder() {
  const ask = useServerFn(recommendDishes);
  const cart = useCart();
  const [text, setText] = useState("");
  const [avoid, setAvoid] = useState<AvoidOption[]>([]);
  const toggle = (a: AvoidOption) =>
    setAvoid((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]));
  const canAsk = text.trim().length >= 2 || avoid.length > 0;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (loading || !canAsk) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await ask({ data: { craving: text, avoid } }));
    } catch (err) {
      setResult({
        picks: [],
        note: "",
        error: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="site-container craving-finder" aria-labelledby="craving-title">
      <span className="eyebrow">
        <Sparkles size={14} className="inline mr-1" />
        NOT SURE WHAT TO EAT?
      </span>
      <h2 id="craving-title">Tell us your craving.</h2>
      <p className="craving-sub">
        Describe your mood, appetite or dietary needs and we'll suggest dishes from our menu.
      </p>
      <form onSubmit={submit} className="craving-form">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. I want something filling and spicy, no pork"
          aria-label="Describe your craving"
        />
        <Button type="submit" size="lg" disabled={loading || !canAsk}>
          {loading ? "Finding dishes…" : "Suggest dishes"}
        </Button>
      </form>
      <div className="craving-examples">
        {examples.map((x) => (
          <Button variant="outline" size="sm" key={x} type="button" onClick={() => setText(x)}>
            {x}
          </Button>
        ))}
      </div>
      <fieldset className="craving-avoid">
        <legend>Allergies or ingredients to avoid</legend>
        <div className="craving-examples">
          {AVOID_OPTIONS.map((a) => (
            <Button
              variant="outline"
              size="sm"
              key={a}
              type="button"
              aria-pressed={avoid.includes(a)}
              className={avoid.includes(a) ? "active" : ""}
              onClick={() => toggle(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </fieldset>
      {avoid.length > 0 && (
        <div className="craving-warning" role="note">
          <TriangleAlert size={18} />
          <p>
            <strong>Please check before you order.</strong> We don't have full ingredient lists for
            our dishes, so these filters only help narrow suggestions. They can't guarantee a dish
            is free of {avoid.join(", ").toLowerCase()}. If you have an allergy, call Kumchop to
            confirm ingredients and how the food is prepared before ordering.
          </p>
        </div>
      )}
      {result?.error && (
        <p role="alert" className="form-feedback">
          {result.error}
        </p>
      )}
      {result && !result.error && (
        <div role="status">
          {result.note && <p className="craving-note">{result.note}</p>}
          {result.picks.length === 0 ? (
            <p className="craving-note">
              No matching dishes are available right now — try describing it differently.
            </p>
          ) : (
            <div className="craving-results">
              {result.picks.map((p) => {
                const it = findItem(p.id);
                if (!it) return null;
                return (
                  <article key={p.id} className="craving-card">
                    <img src={it.image} alt="" loading="lazy" />
                    <div>
                      <h3>{it.name}</h3>
                      <p>{p.reason}</p>
                      <strong>{money(it.priceKobo)}</strong>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        cart.add(it.id);
                        toast.success(`Added ${it.name} to order`, {
                          action: {
                            label: "View Cart",
                            onClick: () => cart.setDrawerOpen(true),
                          },
                          duration: 2500,
                        });
                      }}
                    >
                      <Plus />
                      Add
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
          <p className="craving-warning craving-warning-small" role="note">
            <TriangleAlert size={16} />
            Suggestions are made by AI from dish names only. Always confirm ingredients and
            allergens with Kumchop before ordering.
          </p>
        </div>
      )}
    </section>
  );
}
