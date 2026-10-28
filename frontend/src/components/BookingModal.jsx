import { useEffect, useState } from 'react';
import { api, kes } from '../api.js';

const TYPES = { sedan: 'Sedan / Hatchback', suv: 'SUV / Crossover', van: 'Van / Pickup', luxury: 'Luxury / Sports' };
const blank = { name: '', phone: '', email: '', vehicleType: 'sedan', vehicle: '', plate: '', slot: '', notes: '', services: [] };

export default function BookingModal({ catalog, preselect, onClose, staffMode = false, staffKey, onDone }) {
  const [f, setF] = useState({ ...blank, services: preselect ? [preselect] : [] });
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k) => setF({ ...f, services: f.services.includes(k) ? f.services.filter((s) => s !== k) : [...f.services, k] });

  useEffect(() => {
    api('/quote', { method: 'POST', body: { services: f.services, vehicleType: f.vehicleType } }).then((r) => setTotal(r.total)).catch(() => {});
  }, [f.services, f.vehicleType]);
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const path = staffMode ? '/admin/bookings' : '/bookings';
      const r = await api(path, { method: 'POST', body: f, key: staffKey });
      if (staffMode) { onDone?.(); onClose(); } else setDone(r);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Book a service">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-line bg-panel p-6 sm:p-8">
        {done ? (
          <div className="py-8 text-center">
            <h2 className="metal font-display text-3xl font-extrabold italic">Booking received</h2>
            <p className="mx-auto mt-4 max-w-sm text-steel">Reference #{done.id}. Estimated total {kes(done.total)}. We will call {f.phone} to confirm your slot.</p>
            <button className="btn-red mt-8" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="metal font-display text-3xl font-extrabold italic">{staffMode ? 'Add walk-in' : 'Book a service'}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="text-2xl text-steel hover:text-white">×</button>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm text-steel">Services</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(catalog.services).map(([k, s]) => (
                  <label key={k} className={`flex cursor-pointer items-center justify-between border px-3 py-2.5 ${f.services.includes(k) ? 'border-redline-hot bg-redline/10' : 'border-line'}`}>
                    <span><input type="checkbox" className="mr-2 accent-red-600" checked={f.services.includes(k)} onChange={() => toggle(k)} />{s.label}</span>
                    <span className="text-sm text-steel">from {kes(s.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-steel">Vehicle type
                <select className="field mt-1" value={f.vehicleType} onChange={set('vehicleType')}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label className="text-sm text-steel">Make and model<input className="field mt-1" placeholder="Toyota Prado" value={f.vehicle} onChange={set('vehicle')} /></label>
              <label className="text-sm text-steel">Number plate<input className="field mt-1" placeholder="KDA 123A" value={f.plate} onChange={set('plate')} /></label>
              <label className="text-sm text-steel">Preferred slot<input type="datetime-local" className="field mt-1" value={f.slot} onChange={set('slot')} /></label>
              <label className="text-sm text-steel">Your name<input required className="field mt-1" value={f.name} onChange={set('name')} /></label>
              <label className="text-sm text-steel">Phone<input required type="tel" className="field mt-1" placeholder="07XX XXX XXX" value={f.phone} onChange={set('phone')} /></label>
              <label className="text-sm text-steel sm:col-span-2">Email (optional)<input type="email" className="field mt-1" value={f.email} onChange={set('email')} /></label>
              <label className="text-sm text-steel sm:col-span-2">Notes<textarea rows="2" className="field mt-1" value={f.notes} onChange={set('notes')} /></label>
            </div>
            {err && <p role="alert" className="text-redline-hot">{err}</p>}
            <div className="flex items-center justify-between border-t border-line pt-5">
              <div><div className="text-sm text-steel">Estimated total</div><div className="font-display text-2xl font-semibold">{kes(total)}</div></div>
              <button className="btn-red" disabled={busy}>{busy ? 'Sending…' : staffMode ? 'Add booking' : 'Request booking'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
