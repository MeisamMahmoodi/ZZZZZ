import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    county?: string;
  };
  lat: string;
  lon: string;
}

export interface AddressValue {
  formatted: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: string;
  onChange: (value: AddressValue) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder = 'Straße, Nr, PLZ Stadt…', className }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
      setSelected(value !== '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 5) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=de,at,ch&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'de' } });
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 420);
  };

  const pick = (r: NominatimResult) => {
    const a = r.address;
    const street = a.road ?? '';
    const nr = a.house_number ?? '';
    const plz = a.postcode ?? '';
    const city = a.city ?? a.town ?? a.village ?? a.county ?? '';
    const formatted = [street, nr].filter(Boolean).join(' ') + (plz || city ? ', ' + [plz, city].filter(Boolean).join(' ') : '');
    setQuery(formatted);
    setSelected(true);
    setOpen(false);
    onChange({ formatted, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isIncomplete = !selected && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isIncomplete ? 'text-[#F97316]' : 'text-[#94A3B8]'}`} />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => { if (results.length > 0 && !selected) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className={`input-field !pl-9 !pr-9 ${isIncomplete ? 'border-[#F97316] focus:ring-[#F97316]/20' : ''} ${className ?? ''}`}
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] animate-spin" />
        )}
      </div>

      {isIncomplete && (
        <p className="text-[11px] text-[#F97316] mt-1 font-medium flex items-center gap-1">
          Bitte eine Adresse aus der Liste auswählen, um Straße, Nr., PLZ und Stadt korrekt zu hinterlegen.
        </p>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] overflow-hidden animate-scale-in">
          {results.map(r => {
            const a = r.address;
            const street = [a.road, a.house_number].filter(Boolean).join(' ');
            const location = [a.postcode, a.city ?? a.town ?? a.village ?? a.county].filter(Boolean).join(' ');
            const country = a.country ?? '';
            return (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); pick(r); }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors flex items-start gap-3 border-b border-[#F1F5F9] last:border-0"
                >
                  <MapPin size={14} className="text-[#94A3B8] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{street || r.display_name.split(',')[0]}</p>
                    <p className="text-xs text-[#64748B] truncate">{[location, country].filter(Boolean).join(', ')}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
