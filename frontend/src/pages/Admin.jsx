import { useCallback, useEffect, useState } from 'react';
import { api, kes } from '../api.js';
import BookingModal from '../components/BookingModal.jsx';

const TABS = ['Orders', 'Customers', 'Today'];

export default function Admin() {
  const [key, setKey] = useState(sessionStorage.getItem('rl_key') || '');
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState('');

  async function login(e) {
    e?.preventDefault();
    try { await api('/login', { method: 'POST', key }); sessionStorage.setItem('rl_key', key); setAuthed(true); setErr(''); }
    catch (x) { setErr(x.message); }
  }
  useEffect(() => { if (key) login(); }, []); // eslint-disable-line

  if (!authed) return (
    <main className="grid min-h-screen place-items-center bg-obsidian p-6">
      <form onSubmit={login} className="w-full max-w-sm space-y-4 border border-line bg-panel p-8">
        <img src="/logo.jpeg" alt="Redline Auto Spa" className="mx-auto h-24 w-24 object-cover" />
        <input type="password" className="field" placeholder="Staff password" value={key} onChange={(e) => setKey(e.target.value)} />
        {err && <p role="alert" className="text-redline-hot">{err}</p>}
        <button className="btn-red w-full">Sign in</button>
      </form>
    </main>
  );
  return <Dashboard k={key} out={() => { sessionStorage.removeItem('rl_key'); setAuthed(false); }} />;
}

function Dashboard({ k, out }) {
  const [tab, setTab] = useState('Orders');
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [walkin, setWalkin] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, b, c, s] = await Promise.all(['/admin/meta', '/admin/bookings', '/admin/customers', '/admin/stats'].map((p) => api(p, { key: k })));
      setMeta(m); setRows(b); setCustomers(c); setStats(s);
    } catch (x) { setErr(x.message); }
  }, [k]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const patch = async (id, body) => {
    try { await api(`/admin/bookings/${id}`, { method: 'PATCH', body, key: k }); load(); } catch (x) { setErr(x.message); }
  };
  if (!meta) return <p className="p-10 text-steel">{err || 'Loading…'}</p>;

  return (
    <div className="min-h-screen bg-obsidian">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div className="flex items-center gap-4"><img src="/logo.jpeg" alt="" className="h-10 w-10 object-cover" /><span className="font-display text-xl font-semibold">Operations</span></div>
        <nav className="flex gap-1" aria-label="Sections">
          {TABS.map((t) => <button key={t} onClick={() => setTab(t)} aria-current={tab === t} className={`px-4 py-2 ${tab === t ? 'border-b-2 border-redline-hot text-white' : 'text-steel hover:text-white'}`}>{t}</button>)}
        </nav>
        <div className="flex gap-3"><button className="btn-red !py-2" onClick={() => setWalkin(true)}>Add walk-in</button><button className="btn-ghost" onClick={out}>Sign out</button></div>
      </header>
      {err && <p role="alert" className="px-6 pt-4 text-redline-hot">{err}</p>}
      <main className="p-6">
        {tab === 'Orders' && <Board rows={rows} meta={meta} patch={patch} />}
        {tab === 'Customers' && <Customers list={customers} meta={meta} />}
        {tab === 'Today' && stats && <Today s={stats} />}
      </main>
      {walkin && <BookingModal staffMode staffKey={k} catalog={meta} onClose={() => setWalkin(false)} onDone={load} />}
    </div>
  );
}

function Board({ rows, meta, patch }) {
  return (
    <div className="grid gap-4 overflow-x-auto md:grid-cols-5">
      {meta.statuses.map((st) => {
        const col = rows.filter((r) => r.status === st);
        return (
          <section key={st} className="min-w-[230px]" aria-label={st}>
            <h2 className="mb-3 flex justify-between border-b border-line pb-2 font-display text-lg">{st}<span className="text-steel">{col.length}</span></h2>
            <div className="space-y-3">
              {col.length === 0 && <p className="text-sm text-steel/60">Nothing here.</p>}
              {col.map((r) => (
                <article key={r.id} className="border border-line bg-panel p-3 text-sm">
                  <div className="flex justify-between"><b>{r.customer_name}</b><span className="text-steel">#{r.id}</span></div>
                  <div className="text-steel">{r.vehicle || 'Vehicle'} {r.plate && `(${r.plate})`}</div>
                  <div className="mt-1">{r.services.map((s) => meta.services[s]?.label).join(', ')}</div>
                  <div className="mt-1 flex justify-between text-steel"><span>{r.slot ? r.slot.replace('T', ' ') : 'Walk-in'}</span><span>{kes(r.total)}</span></div>
                  <div className="mt-3 grid gap-2">
                    <select aria-label="Assign staff" className="field !py-1.5" value={r.staff_id ?? ''} onChange={(e) => patch(r.id, { staffId: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">Unassigned</option>{meta.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select aria-label="Status" className="field !py-1.5" value={r.status} onChange={(e) => patch(r.id, { status: e.target.value })}>
                      {meta.statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Customers({ list, meta }) {
  const [q, setQ] = useState('');
  const shown = list.filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="max-w-4xl">
      <input className="field mb-4 max-w-sm" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 && <p className="text-steel">No customers yet. They appear after the first booking.</p>}
      {shown.map((c) => (
        <details key={c.id} className="border-b border-line py-3">
          <summary className="flex cursor-pointer justify-between"><span><b>{c.name}</b> <span className="text-steel">{c.phone}</span></span><span className="text-steel">{c.visits} visits, {kes(c.spent)}</span></summary>
          <ul className="mt-3 space-y-1 pl-4 text-sm text-steel">
            {c.bookings.map((b, i) => <li key={i}>{b.created_at.slice(0, 10)}: {b.vehicle || 'Vehicle'} {b.plate && `(${b.plate})`}, {b.services.map((s) => meta.services[s]?.label).join(', ')}, {b.status}, {kes(b.total)}</li>)}
          </ul>
        </details>
      ))}
    </div>
  );
}

function Today({ s }) {
  const cards = [['Bookings today', s.bookingsToday], ['Open jobs', s.openJobs], ['Completed today', s.completedToday], ['Revenue today', kes(s.revenueToday)], ['Revenue, last 7 days', kes(s.revenueWeek)]];
  return (
    <div className="max-w-4xl">
      <div className="grid gap-px bg-line sm:grid-cols-3">{cards.map(([l, v]) => <div key={l} className="bg-panel p-6"><div className="text-sm text-steel">{l}</div><div className="mt-1 font-display text-3xl font-semibold">{v}</div></div>)}</div>
      <h2 className="mt-10 font-display text-xl">Staff workload (jobs in progress)</h2>
      <ul className="mt-3 space-y-2">{s.staffLoad.map((x) => <li key={x.name} className="flex items-center gap-3"><span className="w-28">{x.name}</span><div className="h-2 bg-gradient-to-r from-redline to-redline-hot" style={{ width: `${Math.max(x.jobs, 0.1) * 40}px` }} /><span className="text-steel">{x.jobs}</span></li>)}</ul>
    </div>
  );
}
