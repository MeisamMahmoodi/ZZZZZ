import { Shield } from 'lucide-react';

interface SectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
}

function Section({ id, title, children }: SectionProps) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 scroll-mt-6">
      <h2 className="text-base font-semibold text-[#0F172A] mb-4">{title}</h2>
      <div className="text-sm text-[#475569] leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export function Datenschutz() {
  const toc = [
    { id: 'm3', label: 'Verantwortlicher' },
    { id: 'mOverview', label: 'Übersicht der Verarbeitungen' },
    { id: 'm2427', label: 'Maßgebliche Rechtsgrundlagen' },
    { id: 'm27', label: 'Sicherheitsmaßnahmen' },
    { id: 'm25', label: 'Übermittlung von personenbezogenen Daten' },
    { id: 'm24', label: 'Internationale Datentransfers' },
    { id: 'm12', label: 'Datenspeicherung und Löschung' },
    { id: 'm10', label: 'Rechte der betroffenen Personen' },
    { id: 'm317', label: 'Geschäftliche Leistungen' },
    { id: 'm225', label: 'Webhosting' },
    { id: 'm134', label: 'Einsatz von Cookies' },
    { id: 'm15', label: 'Änderung und Aktualisierung' },
    { id: 'm42', label: 'Begriffsdefinitionen' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
            <Shield size={17} className="text-[#475569]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Datenschutzerklärung</h1>
        </div>
        <p className="text-[#64748B] text-sm mt-1.5 ml-12">Stand: 9. Mai 2026</p>
      </div>

      {/* Table of contents */}
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 mb-5">
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-4">Inhaltsübersicht</p>
        <ol className="space-y-1.5">
          {toc.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-[#334155] hover:text-[#0F172A] transition-colors flex items-baseline gap-2"
              >
                <span className="text-[#94A3B8] text-xs w-5 shrink-0">{i + 1}.</span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4">
        <Section id="m3" title="Verantwortlicher">
          <p>
            Meisam Mahmoodi<br />
            Gotelindenstr. 9<br />
            80634, München, Deutschland
          </p>
          <p>Vertretungsberechtigte Personen: Meisam Mahmoodi</p>
          <p>
            E-Mail-Adresse:{' '}
            <a href="mailto:meisam.projects@gmail.com" className="text-[#0F172A] underline underline-offset-2 hover:no-underline">
              meisam.projects@gmail.com
            </a>
          </p>
          <p>Telefon: +49 176 61860432</p>
        </Section>

        <Section id="mOverview" title="Übersicht der Verarbeitungen">
          <p>Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen.</p>
          <div>
            <p className="font-medium text-[#0F172A] mb-2">Arten der verarbeiteten Daten</p>
            <ul className="list-disc list-inside space-y-1 text-[#475569]">
              {['Bestandsdaten', 'Beschäftigtendaten', 'Zahlungsdaten', 'Kontaktdaten', 'Inhaltsdaten', 'Vertragsdaten', 'Nutzungsdaten', 'Meta-, Kommunikations- und Verfahrensdaten', 'Protokolldaten'].map(d => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-[#0F172A] mb-2">Kategorien betroffener Personen</p>
            <ul className="list-disc list-inside space-y-1">
              {['Leistungsempfänger und Auftraggeber', 'Beschäftigte', 'Interessenten', 'Nutzer', 'Geschäfts- und Vertragspartner', 'Dritte Personen', 'Hinweisgeber'].map(d => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-[#0F172A] mb-2">Zwecke der Verarbeitung</p>
            <ul className="list-disc list-inside space-y-1">
              {['Erbringung vertraglicher Leistungen und Erfüllung vertraglicher Pflichten', 'Kommunikation', 'Sicherheitsmaßnahmen', 'Büro- und Organisationsverfahren', 'Bereitstellung unseres Onlineangebotes und Nutzerfreundlichkeit', 'Informationstechnische Infrastruktur', 'Geschäftsprozesse und betriebswirtschaftliche Verfahren'].map(d => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="m2427" title="Maßgebliche Rechtsgrundlagen">
          <p><strong className="text-[#0F172A]">Maßgebliche Rechtsgrundlagen nach der DSGVO:</strong> Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren Basis wir personenbezogene Daten verarbeiten.</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-[#0F172A]">Einwilligung (Art. 6 Abs. 1 S. 1 lit. a) DSGVO)</strong> – Die betroffene Person hat ihre Einwilligung gegeben.</li>
            <li><strong className="text-[#0F172A]">Vertragserfüllung (Art. 6 Abs. 1 S. 1 lit. b) DSGVO)</strong> – Die Verarbeitung ist für die Erfüllung eines Vertrags erforderlich.</li>
            <li><strong className="text-[#0F172A]">Rechtliche Verpflichtung (Art. 6 Abs. 1 S. 1 lit. c) DSGVO)</strong> – Die Verarbeitung ist zur Erfüllung einer rechtlichen Verpflichtung erforderlich.</li>
            <li><strong className="text-[#0F172A]">Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f) DSGVO)</strong> – Die Verarbeitung ist zur Wahrung berechtigter Interessen notwendig.</li>
          </ul>
          <p><strong className="text-[#0F172A]">Nationale Datenschutzregelungen in Deutschland:</strong> Zusätzlich gelten nationale Regelungen, insbesondere das Bundesdatenschutzgesetz (BDSG).</p>
        </Section>

        <Section id="m27" title="Sicherheitsmaßnahmen">
          <p>Wir treffen nach Maßgabe der gesetzlichen Vorgaben geeignete technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten.</p>
          <p>Zu den Maßnahmen gehören insbesondere die Sicherung der Vertraulichkeit, Integrität und Verfügbarkeit von Daten durch Kontrolle des physischen und elektronischen Zugangs sowie Verfahren zur Wahrnehmung von Betroffenenrechten.</p>
          <p><strong className="text-[#0F172A]">TLS-/SSL-Verschlüsselung (HTTPS):</strong> Alle Datenübertragungen sind durch TLS-Verschlüsselung gesichert.</p>
        </Section>

        <Section id="m25" title="Übermittlung von personenbezogenen Daten">
          <p>Im Rahmen unserer Verarbeitung kann es vorkommen, dass Daten an andere Stellen übermittelt werden, z.&nbsp;B. IT-Dienstleister. In solchen Fällen beachten wir die gesetzlichen Vorgaben und schließen entsprechende Verträge zum Schutz Ihrer Daten ab.</p>
        </Section>

        <Section id="m24" title="Internationale Datentransfers">
          <p>Sofern wir Daten in ein Drittland übermitteln, erfolgt dies im Einklang mit den gesetzlichen Vorgaben. Für Datenübermittlungen in die USA stützen wir uns vorrangig auf das Data Privacy Framework (DPF) sowie Standardvertragsklauseln.</p>
          <p>
            Weitere Informationen zum DPF:{' '}
            <a href="https://www.dataprivacyframework.gov/" target="_blank" rel="noopener noreferrer" className="text-[#0F172A] underline underline-offset-2 hover:no-underline">
              dataprivacyframework.gov
            </a>
          </p>
        </Section>

        <Section id="m12" title="Allgemeine Informationen zur Datenspeicherung und Löschung">
          <p>Wir löschen personenbezogene Daten, sobald die zugrundeliegenden Einwilligungen widerrufen werden oder keine weiteren rechtlichen Grundlagen bestehen.</p>
          <p className="font-medium text-[#0F172A]">Allgemeine Aufbewahrungsfristen:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong className="text-[#0F172A]">10 Jahre</strong> – Bücher, Aufzeichnungen, Jahresabschlüsse (§ 147 AO, § 257 HGB)</li>
            <li><strong className="text-[#0F172A]">8 Jahre</strong> – Buchungsbelege, Rechnungen (§ 147 AO, § 257 HGB)</li>
            <li><strong className="text-[#0F172A]">6 Jahre</strong> – Übrige Geschäftsunterlagen (§ 147 AO, § 257 HGB)</li>
            <li><strong className="text-[#0F172A]">3 Jahre</strong> – Gewährleistungs- und Schadensersatzansprüche (§§ 195, 199 BGB)</li>
          </ul>
        </Section>

        <Section id="m10" title="Rechte der betroffenen Personen">
          <p>Ihnen stehen nach der DSGVO folgende Rechte zu:</p>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong className="text-[#0F172A]">Widerspruchsrecht</strong> – Widerspruch gegen bestimmte Verarbeitungen</li>
            <li><strong className="text-[#0F172A]">Widerrufsrecht</strong> – Widerruf erteilter Einwilligungen</li>
            <li><strong className="text-[#0F172A]">Auskunftsrecht</strong> – Bestätigung und Auskunft über verarbeitete Daten (Art. 15 DSGVO)</li>
            <li><strong className="text-[#0F172A]">Recht auf Berichtigung</strong> – Korrektur unrichtiger Daten (Art. 16 DSGVO)</li>
            <li><strong className="text-[#0F172A]">Recht auf Löschung</strong> – Löschung Ihrer Daten (Art. 17 DSGVO)</li>
            <li><strong className="text-[#0F172A]">Recht auf Datenübertragbarkeit</strong> – Erhalt Ihrer Daten in maschinenlesbarem Format (Art. 20 DSGVO)</li>
            <li><strong className="text-[#0F172A]">Beschwerderecht</strong> – Beschwerde bei einer Aufsichtsbehörde</li>
          </ul>
        </Section>

        <Section id="m317" title="Geschäftliche Leistungen">
          <p>Wir verarbeiten personenbezogene Daten unserer Vertrags- und Geschäftspartner zur Anbahnung, Durchführung und Abwicklung von Vertragsverhältnissen.</p>
          <p>Verarbeitet werden insbesondere Stammdaten, Kontaktdaten, Vertrags- und Leistungsdaten sowie Zahlungs- und Abrechnungsdaten.</p>
          <p><strong className="text-[#0F172A]">Rechtsgrundlagen:</strong> Art. 6 Abs. 1 lit. b) DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. c) DSGVO (rechtliche Verpflichtung), Art. 6 Abs. 1 lit. f) DSGVO (berechtigte Interessen).</p>
        </Section>

        <Section id="m225" title="Bereitstellung des Onlineangebots und Webhosting">
          <p>Wir verarbeiten die Daten der Nutzer, um ihnen unsere Online-Dienste bereitzustellen. Zu diesem Zweck verarbeiten wir die IP-Adresse des Nutzers.</p>
          <p>Zugriffsdaten werden in Server-Logfiles protokolliert und nach maximal 30 Tagen gelöscht oder anonymisiert.</p>
          <p><strong className="text-[#0F172A]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f) DSGVO (berechtigte Interessen).</p>
        </Section>

        <Section id="m134" title="Einsatz von Cookies">
          <p>Wir verwenden Cookies gemäß den gesetzlichen Vorschriften. Soweit erforderlich, holen wir vorab die Zustimmung der Nutzer ein.</p>
          <p><strong className="text-[#0F172A]">Temporäre Cookies (Session-Cookies):</strong> Werden gelöscht, nachdem der Nutzer das Angebot verlassen hat.</p>
          <p><strong className="text-[#0F172A]">Permanente Cookies:</strong> Bleiben auch nach dem Schließen gespeichert (bis zu 2 Jahre).</p>
          <p><strong className="text-[#0F172A]">Rechtsgrundlagen:</strong> Art. 6 Abs. 1 lit. f) DSGVO, Art. 6 Abs. 1 lit. a) DSGVO (bei Einwilligung).</p>
        </Section>

        <Section id="m15" title="Änderung und Aktualisierung">
          <p>Wir bitten Sie, sich regelmäßig über den Inhalt unserer Datenschutzerklärung zu informieren. Wir passen diese an, sobald Änderungen der von uns durchgeführten Datenverarbeitungen dies erfordern.</p>
        </Section>

        <Section id="m42" title="Begriffsdefinitionen">
          {[
            ['Beschäftigte', 'Personen in einem Beschäftigungsverhältnis, einschließlich ihrer personenbezogenen Daten im Kontext der Beschäftigung.'],
            ['Bestandsdaten', 'Wesentliche Informationen zur Identifikation und Verwaltung von Vertragspartnern und Benutzerkonten.'],
            ['Inhaltsdaten', 'Informationen, die im Zuge der Erstellung und Veröffentlichung von Inhalten generiert werden.'],
            ['Kontaktdaten', 'Informationen, die die Kommunikation ermöglichen: Telefon, Adresse, E-Mail.'],
            ['Meta- und Kommunikationsdaten', 'Daten über die Art und Weise, wie Daten verarbeitet und übermittelt werden.'],
            ['Nutzungsdaten', 'Informationen darüber, wie Nutzer mit digitalen Diensten interagieren.'],
            ['Personenbezogene Daten', 'Alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen.'],
            ['Protokolldaten', 'Informationen über Ereignisse oder Aktivitäten, die in einem System protokolliert wurden.'],
            ['Verantwortlicher', 'Die Stelle, die allein oder gemeinsam über die Zwecke und Mittel der Verarbeitung personenbezogener Daten entscheidet.'],
            ['Verarbeitung', 'Jeder Vorgang im Zusammenhang mit personenbezogenen Daten (Erheben, Speichern, Übermitteln, Löschen etc.).'],
            ['Vertragsdaten', 'Spezifische Informationen, die sich auf die Formalisierung einer Vereinbarung beziehen.'],
            ['Zahlungsdaten', 'Alle Informationen zur Abwicklung von Zahlungstransaktionen.'],
          ].map(([term, def]) => (
            <div key={term as string}>
              <p className="font-medium text-[#0F172A]">{term}</p>
              <p className="mt-0.5">{def}</p>
            </div>
          ))}
        </Section>

        <div className="text-center pb-6">
          <p className="text-xs text-[#94A3B8]">
            Erstellt mit{' '}
            <a href="https://datenschutz-generator.de/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:no-underline">
              Datenschutz-Generator.de
            </a>
            {' '}von Dr. Thomas Schwenke
          </p>
        </div>
      </div>
    </div>
  );
}
