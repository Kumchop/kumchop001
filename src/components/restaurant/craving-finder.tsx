import { useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findItem, money } from '@/lib/menu';
import { useCart } from './cart';
import { recommendDishes, type RecommendResult } from '@/lib/recommend.functions';

const examples = ['Something spicy with rice', 'Light and no meat', 'A cold sweet treat', 'Big meal under ₦5,000'];

export function CravingFinder() {
  const ask = useServerFn(recommendDishes);
  const cart = useCart() as unknown as { add?: (id: string) => void };
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (loading || text.trim().length < 2) return;
    setLoading(true); setResult(null);
    try { setResult(await ask({ data: { craving: text } })); }
    catch (err) { setResult({ picks: [], note: '', error: err instanceof Error ? err.message : 'Something went wrong.' }); }
    finally { setLoading(false); }
  };
  return (
    <section className="site-container craving-finder" aria-labelledby="craving-title">
      <span className="eyebrow"><Sparkles size={14} className="inline mr-1" />NOT SURE WHAT TO EAT?</span>
      <h2 id="craving-title">Tell us your craving.</h2>
      <p className="craving-sub">Describe your mood, appetite or dietary needs and we'll suggest dishes from our menu.</p>
      <form onSubmit={submit} className="craving-form">
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={500} rows={2}
          placeholder="e.g. I want something filling and spicy, no pork" aria-label="Describe your craving" />
        <Button type="submit" size="lg" disabled={loading || text.trim().length < 2}>{loading ? 'Finding dishes…' : 'Suggest dishes'}</Button>
      </form>
      <div className="craving-examples">{examples.map(x => <button key={x} type="button" onClick={() => setText(x)}>{x}</button>)}</div>
      {result?.error && <p role="alert" className="form-feedback">{result.error}</p>}
      {result && !result.error && (
        <div role="status">
          {result.note && <p className="craving-note">{result.note}</p>}
          {result.picks.length === 0 ? <p className="craving-note">No matching dishes are available right now — try describing it differently.</p> :
            <div className="craving-results">{result.picks.map(p => { const it = findItem(p.id); if (!it) return null; return (
              <article key={p.id} className="craving-card">
                <img src={it.image} alt="" loading="lazy" />
                <div><h3>{it.name}</h3><p>{p.reason}</p><strong>{money(it.priceKobo)}</strong></div>
                {cart.add && <Button size="sm" variant="outline" onClick={() => cart.add!(it.id)}><Plus />Add</Button>}
              </article>); })}</div>}
          <p className="fine-print">Suggestions are made by AI. Please confirm ingredients and allergies with Kumchop.</p>
        </div>
      )}
    </section>
  );
}
