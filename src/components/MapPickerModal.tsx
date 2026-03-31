import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon (webpack/vite issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom pink marker icon
const pinkIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#FF169B"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

interface MapPickerModalProps {
  onClose: () => void;
  onConfirm: (address: string, url: string) => void;
  initialAddress?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({ onClose, onConfirm, initialAddress }) => {
  const [address, setAddress] = useState(initialAddress || '');
  const [pickedUrl, setPickedUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reverse geocode using Nominatim (free)
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.warn('Erro ao geocodificar:', err);
    }
  }, []);

  // Update marker position and URL
  const updatePosition = useCallback((lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    setPickedUrl(url);
    reverseGeocode(lat, lng);

    if (markerRef.current && mapInstance.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [reverseGeocode]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Default center (Anápolis/GO region)
    const defaultCenter: L.LatLngExpression = [-16.3267, -48.953];

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Dark map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control (right side)
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Marker (draggable)
    const marker = L.marker(defaultCenter, {
      draggable: true,
      icon: pinkIcon,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      updatePosition(pos.lat, pos.lng);
    });

    // Click to place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updatePosition(e.latlng.lat, e.latlng.lng);
    });

    mapInstance.current = map;
    markerRef.current = marker;

    // Invalidate size after animation
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, [updatePosition]);

  // Search with Nominatim (debounced)
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=br&limit=5`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch (err) {
        console.warn('Erro na busca:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Select search result
  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
    }

    setAddress(result.display_name);
    setPickedUrl(`https://www.google.com/maps?q=${lat},${lng}`);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#FF169B]" />
            <span>Colocar Alfinete</span>
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-zinc-900/50 relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Pesquisar local ou endereço..."
              className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 pr-10 text-white focus:border-[#FF169B] outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#FF169B] animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-zinc-600" />
              )}
            </div>
          </div>

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute left-4 right-4 top-[72px] bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden z-[9999] shadow-2xl">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border-b border-zinc-800/50 last:border-0 flex items-start space-x-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF169B] mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-[45vh] md:h-[50vh] bg-zinc-900"
          onClick={() => setShowResults(false)}
        />

        {/* Footer */}
        <div className="p-6 bg-zinc-900/20 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Local Escolhido</p>
            <p className="text-xs text-zinc-300 line-clamp-2">{address || 'Clique no mapa para marcar...'}</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="flex-1 h-12 text-zinc-400 font-bold hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={() => onConfirm(address, pickedUrl)}
              disabled={!pickedUrl}
              className="flex-[2] h-14 bg-gradient-to-r from-[#FF169B] to-purple-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-900/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
            >
              Confirmar Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
