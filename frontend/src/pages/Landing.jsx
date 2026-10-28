import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, kes } from '../api.js';
import BookingModal from '../components/BookingModal.jsx';

const COPY = {
  detailing: 'Interior and exterior rejuvenation, done panel by panel, by hand.',
  waxing: 'A protective, high-gloss mirror finish applied and buffed manually.',
  carpet: 'Deep steam extraction and spot treatment for stains and odours.',
  vacuum: 'Seats, mats, vents and seams cleared of dust and debris.',
};

export default function Landing() {
  const [catalog, setCatalog] = useState(null);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(null);
  useEffect(() => { api('/catalog').then(setCatalog).catch(() => {}); }, []);
  const book = (k = null) => { setPick(k); setOpen(true); };

  return (
    <div className="min-h-screen bg-obsidian">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <img src="/logo.jpeg" alt="Redline Auto Spa" className="h-14 w-14 object-cover" />
        <nav className="flex items-center gap-6 text-sm">
          <a href="#services" className="text-steel hover:text-white">Services</a>
          <a href="#process" className="text-steel hover:text-white">How it works</a>
          <button className="btn-ghost" onClick={() => book()}>Book service</button>
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-28 pt-20 sm:pt-32">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[28rem] w-[28rem] rounded-full bg-redline/20 blur-[120px]" />
        <p className="text-steel">Hand-finished car care, Nairobi</p>
        <h1 className="metal mt-4 font-display text-6xl font-extrabold italic leading-[0.95] sm:text-8xl">Driven by<br />Perfection</h1>
        <div className="streak mt-8 h-1 w-48 origin-left bg-gradient-to-r from-redline to-redline-hot" />
        <p className="mt-8 max-w-md text-lg text-steel">No automated bays. Every vehicle is cleaned, waxed and finished by trained hands, with a quality check before the keys come back.</p>
        <button className="btn-red mt-10 text-lg" onClick={() => book()}>Book service</button>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="metal font-display text-4xl font-extrabold italic">Four services, done by hand</h2>
        <div className="mt-10 grid gap-px bg-line sm:grid-cols-2">
          {catalog && Object.entries(catalog.services).map(([k, s]) => (
            <article key={k} className="flex flex-col justify-between bg-panel p-8">
              <div>
                <h3 className="font-display text-2xl font-semibold">{s.label}</h3>
                <p className="mt-3 max-w-sm text-steel">{COPY[k]}</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <span className="text-steel">from {kes(s.price)}</span>
                <button className="text-redline-hot hover:underline" onClick={() => book(k)}>Book {s.label.toLowerCase()}</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="metal font-display text-4xl font-extrabold italic">From request to keys back</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-4">
          {['Send your booking request', 'We confirm your slot by phone', 'A named technician works on your car', 'We inspect it before handover'].map((t, i) => (
            <li key={t} className="border-t-2 border-redline pt-4"><span className="font-display text-xl text-platinum">{i + 1}</span><p className="mt-2 text-steel">{t}</p></li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-steel">
        Redline Auto Spa. Driven by Perfection. <Link to="/staff" className="ml-4 hover:text-white">Staff login</Link>
      </footer>
      {open && catalog && <BookingModal catalog={catalog} preselect={pick} onClose={() => setOpen(false)} />}
    </div>
  );
}
