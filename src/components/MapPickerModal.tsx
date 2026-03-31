import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapPickerModalProps {
  onClose: () => void;
  onConfirm: (address: string, url: string) => void;
  initialAddress?: string;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({ onClose, onConfirm, initialAddress }) => {
  const [address, setAddress] = useState(initialAddress || '');
  const [pickedUrl, setPickedUrl] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    } else {
      init();
    }

    function init() {
      const google = (window as any).google;
      // Default center (Anapolis/GO region)
      const defaultCenter = { lat: -16.3267, lng: -48.953 }; 
      
      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        styles: [ 
          { "featureType": "all", "elementType": "all", "stylers": [ { "invert_lightness": true }, { "saturation": 10 }, { "lightness": 10 }, { "gamma": 0.5 }, { "hue": "#ff169b" } ] } 
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });

      const marker = new google.maps.Marker({ map, draggable: true });
      const geocoder = new google.maps.Geocoder();

      const updateResult = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        setPickedUrl(url);
        geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      };

      map.addListener('click', (e: any) => {
        const pos = e.latLng;
        marker.setPosition(pos);
        updateResult(pos.lat(), pos.lng());
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) updateResult(pos.lat(), pos.lng());
      });

      // Autocomplete search
      if (searchInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
        autocomplete.bindTo('bounds', map);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry || !place.geometry.location) return;
          map.setCenter(place.geometry.location);
          map.setZoom(17);
          marker.setPosition(place.geometry.location);
          setAddress(place.formatted_address || place.name || '');
          setPickedUrl(place.url || `https://www.google.com/maps?q=${place.geometry.location.lat()},${place.geometry.location.lng()}`);
        });
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/10">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#FF169B]" />
            <span>Colocar Alfinete</span>
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-zinc-900/50">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Pesquisar local ou endereço..."
            className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-xl px-4 text-white focus:border-[#FF169B] outline-none"
          />
        </div>

        <div ref={mapRef} className="w-full h-[45vh] md:h-[50vh] bg-zinc-900">
          {/* Map injected here */}
        </div>

        <div className="p-6 bg-zinc-900/20 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
             <p className="text-[10px] text-zinc-600 font-black uppercase mb-1">Local Escolhido</p>
             <p className="text-xs text-zinc-300 line-clamp-1">{address || 'Clique no mapa para marcar...'}</p>
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
