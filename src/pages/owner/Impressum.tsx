import { FileText, Mail, Phone, MapPin } from 'lucide-react';

export function Impressum() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Impressum</h1>
        <p className="text-[#64748B] text-sm mt-1.5">Angaben gemäß § 5 TMG</p>
      </div>

      <div className="space-y-5">
        {/* Anbieter */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
              <FileText size={17} className="text-[#475569]" />
            </div>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-widest">Anbieter</h2>
          </div>
          <p className="text-[#0F172A] font-semibold text-base">Meisam Mahmoodi</p>
          <p className="text-[#64748B] text-sm mt-1">meizo – Reinigungsmanagement-Software</p>
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
              <MapPin size={17} className="text-[#475569]" />
            </div>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-widest">Adresse</h2>
          </div>
          <div className="text-sm text-[#334155] space-y-0.5 leading-relaxed">
            <p>Gotelindenstr. 9</p>
            <p>80634 München</p>
            <p>Deutschland</p>
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
              <Mail size={17} className="text-[#475569]" />
            </div>
            <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-widest">Kontakt</h2>
          </div>
          <div className="space-y-3">
            <a
              href="mailto:meisam.projects@gmail.com"
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center group-hover:bg-[#F1F5F9] transition-colors">
                <Mail size={14} className="text-[#64748B]" />
              </div>
              <span className="text-sm text-[#0F172A] group-hover:text-[#334155] transition-colors">
                meisam.projects@gmail.com
              </span>
            </a>
            <a
              href="tel:+4917661860432"
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center group-hover:bg-[#F1F5F9] transition-colors">
                <Phone size={14} className="text-[#64748B]" />
              </div>
              <span className="text-sm text-[#0F172A] group-hover:text-[#334155] transition-colors">
                +49 176 61860432
              </span>
            </a>
          </div>
        </div>

        {/* Haftungshinweis */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Haftungshinweis</h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
            externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
            verantwortlich.
          </p>
        </div>

        <p className="text-xs text-[#94A3B8] text-center pb-4">
          Stand: Mai 2026
        </p>
      </div>
    </div>
  );
}
