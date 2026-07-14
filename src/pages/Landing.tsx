import { useState } from 'react';
import { Check, MapPin, Clock, Users, MessageCircle, Globe2 } from 'lucide-react';
import { BASE_FEE_EUR, PER_EMPLOYEE_EUR, calculateMonthlyPrice } from '../lib/plans';

const CALENDLY = 'https://calendly.com/meisam-meizo/30min';

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#F1F5F9]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/apple-touch-icon.png" alt="meizo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg text-[#0F172A] tracking-tight">meizo</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm font-semibold text-[#334155] px-4 py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
            Anmelden
          </a>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-white bg-[#16A34A] px-4 py-2 rounded-lg hover:bg-[#15803D] transition-colors shadow-sm"
          >
            Termin buchen →
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#DC2626] mb-4">Reinigungsfirmen kennen das</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.05]">
          Es ist 06:47 Uhr.<br />Eine Krankmeldung kommt rein.
        </h1>
        <p className="text-lg text-[#475569] mt-5 leading-relaxed max-w-lg">
          Statt WhatsApp-Rundruf und Durchtelefonieren sucht meizo automatisch einen Ersatz — während Sie noch Ihren Kaffee trinken.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0F172A] text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-[#1E293B] transition-colors shadow-sm"
          >
            Gratis Termin buchen →
          </a>
          <a
            href="/pricing"
            className="bg-white text-[#0F172A] font-bold px-6 py-3.5 rounded-2xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
          >
            Preis berechnen
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#64748B]">
          <span>🇩🇪 München</span>
          <span>Erster Monat kostenlos</span>
          <span>Keine Vertragsbindung</span>
        </div>
      </div>
      <div className="relative">
        <img
          src="/Dashboard_mit_Einsatz.png"
          alt="meizo Dashboard mit heutigen Einsätzen"
          className="rounded-2xl border border-[#E2E8F0] shadow-[0_20px_60px_-10px_rgba(15,23,42,0.15)] w-full"
        />
      </div>
    </section>
  );
}

function ProblemSection() {
  const cards = [
    { title: 'Stundenzettel & WhatsApp-Chaos', text: 'Krankmeldungen, Ersatzsuche und Arbeitszeiten laufen über 3 verschiedene Kanäle, die nichts voneinander wissen.' },
    { title: 'Keine Übersicht bei Ausfällen', text: 'Wer ist krank, wer ist frei, wer könnte einspringen? Ohne System steckt das alles im Kopf des Chefs.' },
    { title: 'Nachweise fehlen beim Kunden', text: 'Wurde wirklich geputzt, wann, von wem? Ohne Foto- und GPS-Nachweis bleibt nur Ihr Wort gegen das des Kunden.' },
  ];
  return (
    <section className="bg-[#F8FAFC] py-16 border-y border-[#F1F5F9]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Das Problem</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-10">Kommt Ihnen das bekannt vor?</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {cards.map(c => (
            <div key={c.title} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h3 className="font-bold text-[#0F172A] mb-2">{c.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ModuleProps {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  text: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
}

function Module({ eyebrow, eyebrowColor, title, text, bullets, image, imageAlt, reverse }: ModuleProps) {
  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center py-14 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: eyebrowColor }}>{eyebrow}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-4">{title}</h3>
        <p className="text-[#475569] leading-relaxed mb-5">{text}</p>
        <ul className="space-y-2.5">
          {bullets.map(b => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-[#334155] font-medium">
              <span className="w-5 h-5 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
                <Check size={11} className="text-[#16A34A]" strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <img
        src={image}
        alt={imageAlt}
        className="rounded-2xl border border-[#E2E8F0] shadow-[0_16px_48px_-12px_rgba(15,23,42,0.15)] w-full"
      />
    </div>
  );
}

function ModulesSection() {
  return (
    <section className="max-w-6xl mx-auto px-5 sm:px-6 divide-y divide-[#F1F5F9]">
      <Module
        eyebrow="Das hat kein anderer"
        eyebrowColor="#7C3AED"
        title="Automatische Ersatzsuche bei Krankmeldung"
        text="Meldet sich jemand krank, fragt meizo selbst die passenden Kollegen an — per WhatsApp oder SMS, mit Kontext zu Ort und Uhrzeit. Kein Durchtelefonieren, keine Rundruf-Nachrichten."
        bullets={['Läuft automatisch, ohne Ihr Zutun', 'Kennt Verfügbarkeit und Qualifikation', 'Sie behalten jederzeit die manuelle Kontrolle']}
        image="/Anfrage_Mitarbeiter.png"
        imageAlt="meizo fragt automatisch einen Ersatz-Mitarbeiter per WhatsApp an"
      />
      <Module
        eyebrow="Nachweis & Vertrauen"
        eyebrowColor="#16A34A"
        title="GPS-Check-in mit Foto-Nachweis"
        text="Ihre Mitarbeiter checken vor Ort ein — mit Standortprüfung und Foto. Sie sehen live, wer wo ist, ohne nachzufragen."
        bullets={['Fälschungssicherer Nachweis fürs Kundengespräch', 'Live-Status ohne Anruf', 'Automatisch in der Abrechnung erfasst']}
        image="/CheckInFotoBestätigung.PNG"
        imageAlt="Check-in mit Foto- und GPS-Bestätigung in der Mitarbeiter-App"
        reverse
      />
      <Module
        eyebrow="Abrechnung"
        eyebrowColor="#0F172A"
        title="Zeiterfassung, die sich von selbst rechnet"
        text="Jeder Check-in und Check-out landet automatisch in der Abrechnung — mit GPS- und Foto-Nachweis, fertig für den Steuerberater."
        bullets={['DATEV-Export mit einem Klick', 'Individuelle Stundensätze pro Mitarbeiter', 'Keine manuell abgetippten Stundenzettel mehr']}
        image="/Zeitstempel.png"
        imageAlt="Zeitstempel-Übersicht mit Check-in und Check-out je Mitarbeiter"
      />
      <Module
        eyebrow="8 Sprachen"
        eyebrowColor="#DC2626"
        title="Sie reden Deutsch. Ihr Team redet acht Sprachen."
        text="Die Mitarbeiter-App spricht automatisch Rumänisch, Türkisch, Polnisch, Arabisch, Bulgarisch und mehr — kein Missverständnis bei Krankmeldung oder Einsatzplan."
        bullets={['Automatische Übersetzung, kein Zusatzaufwand', 'Auch Rechts-nach-Links-Sprachen (Arabisch)', 'Senkt die Hemmschwelle für nicht-deutschsprachiges Personal']}
        image="/Rumänisch.PNG"
        imageAlt="Mitarbeiter-App auf Rumänisch"
        reverse
      />
    </section>
  );
}

function SwitchSection() {
  const groups = [
    {
      from: 'Excel & WhatsApp',
      points: [
        { bad: 'Stundenzettel auf Papier, abgetippt', good: 'Digital erfasst, direkt in der Abrechnung' },
        { bad: 'Ersatzsuche per Rundruf', good: 'Automatische Ersatzanfrage' },
        { bad: 'Keine Nachweise fürs Kundengespräch', good: 'GPS- & Foto-Nachweis pro Einsatz' },
      ],
    },
    {
      from: 'Blink oder Crewmeister',
      points: [
        { bad: 'DATEV-Export oft als Zusatzmodul', good: 'Im Grundpreis enthalten' },
        { bad: 'Reine Zeiterfassung, keine Ersatzsuche', good: 'Automatische Ersatzsuche inklusive' },
        { bad: 'Paketpreis + Gebühr pro Nutzer', good: `${BASE_FEE_EUR}€ + ${PER_EMPLOYEE_EUR}€/Mitarbeiter, ohne Zusatzmodule` },
      ],
    },
  ];
  return (
    <section className="bg-[#F8FAFC] py-16 border-y border-[#F1F5F9]">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Warum wechseln</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-10">Egal wo Sie herkommen — es lohnt sich.</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {groups.map(g => (
            <div key={g.from} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-4">Schon bei {g.from}?</p>
              <div className="space-y-4">
                {g.points.map(p => (
                  <div key={p.good} className="flex flex-col gap-1 pb-4 border-b border-[#F1F5F9] last:border-0 last:pb-0">
                    <span className="text-sm text-[#94A3B8] line-through">{p.bad}</span>
                    <span className="text-sm font-semibold text-[#15803D] flex items-center gap-1.5">
                      <Check size={13} strokeWidth={3} /> {p.good}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-[#64748B] mt-8 text-center">
          Wir übernehmen Ihre Mitarbeiter- und Objektdaten kostenlos — kein Aufwand für Sie.
        </p>
      </div>
    </section>
  );
}

function PriceTeaser() {
  const [count, setCount] = useState(10);
  const price = calculateMonthlyPrice(count);
  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-6 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Preis</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-8">Ein Preis. Alle Funktionen.</h2>
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-8">
        <div className="flex items-baseline justify-center gap-1.5 mb-6">
          <span className="text-5xl font-bold tracking-tight text-[#0F172A]">{price} €</span>
          <span className="text-[#94A3B8] font-medium">/ Monat</span>
        </div>
        <div className="mb-2 flex items-center justify-between max-w-sm mx-auto">
          <label htmlFor="landing-count" className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
            <Users size={14} /> Mitarbeiteranzahl
          </label>
          <span className="text-sm font-bold text-[#0F172A]">{count}</span>
        </div>
        <input
          id="landing-count"
          type="range"
          min={1}
          max={60}
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          className="w-full max-w-sm accent-[#0F172A]"
        />
        <p className="text-xs text-[#94A3B8] mt-3">{BASE_FEE_EUR}€ Grundgebühr + {PER_EMPLOYEE_EUR}€ pro Mitarbeiter, keine Zusatzmodule</p>
        <a
          href="/pricing"
          className="inline-block mt-6 bg-[#0F172A] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#1E293B] transition-colors"
        >
          Preisrechner öffnen →
        </a>
      </div>
    </section>
  );
}

const FAQS = [
  { q: 'Fallen Einrichtungsgebühren an?', a: 'Nein. Sie zahlen nur den monatlichen Preis. Einrichtung und Datenübernahme sind kostenlos.' },
  { q: 'Kann ich von Blink, Crewmeister oder Excel wechseln?', a: 'Ja. Wir übernehmen Ihre Mitarbeiter- und Objektdaten persönlich, ohne Aufwand für Sie.' },
  { q: 'Läuft meizo auch auf dem Handy?', a: 'Ja. Ihre Mitarbeiter nutzen die App für Check-in, Krankmeldung und Einsatzplan, Sie verwalten alles im Browser.' },
  { q: 'Was passiert nach der kostenlosen Testphase?', a: 'Sie entscheiden sich für die Fortsetzung oder hören einfach auf. Keine automatische Verlängerung, keine Kreditkarte nötig.' },
  { q: 'Wie erreiche ich Support?', a: 'Direkt bei Meisam, persönlich per Telefon oder E-Mail — kein Ticketsystem, keine Warteschleife.' },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-[#F8FAFC] py-16 border-y border-[#F1F5F9]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-2">Häufige Fragen</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-8">Noch Fragen?</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-[#0F172A] text-sm">{f.q}</span>
                  <span className={`text-[#94A3B8] transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                </button>
                {isOpen && <p className="px-5 pb-4 text-sm text-[#64748B] leading-relaxed">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-6 py-20 text-center">
      <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight mb-4">
        Nie wieder 06:47-Uhr-Panik.
      </h2>
      <p className="text-[#64748B] mb-8 max-w-md mx-auto">
        Erster Monat kostenlos, keine Kreditkarte, keine Vertragsbindung.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <a
          href={CALENDLY}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#16A34A] text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-[#15803D] transition-colors shadow-sm"
        >
          Gratis Termin buchen →
        </a>
        <a
          href="mailto:meisam@meizo.de?subject=Meizo%20Anfrage"
          className="bg-white text-[#0F172A] font-bold px-7 py-3.5 rounded-2xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
        >
          meisam@meizo.de
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#F1F5F9] py-8">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94A3B8]">
        <span>© {new Date().getFullYear()} meizo · München</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><MapPin size={12} /> München</span>
          <span className="flex items-center gap-1"><Clock size={12} /> Erster Monat kostenlos</span>
          <span className="flex items-center gap-1"><Globe2 size={12} /> 8 Sprachen</span>
          <span className="flex items-center gap-1"><MessageCircle size={12} /> Persönlicher Support</span>
        </div>
      </div>
    </footer>
  );
}

export function Landing() {
  return (
    <div className="bg-white">
      <Nav />
      <Hero />
      <ProblemSection />
      <ModulesSection />
      <SwitchSection />
      <PriceTeaser />
      <FaqSection />
      <FinalCta />
      <Footer />
    </div>
  );
}
