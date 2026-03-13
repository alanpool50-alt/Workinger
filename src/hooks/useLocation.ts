import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [cityData, setCityData] = useState<any>(null);

  const detectLocation = async () => {
    // 1. Try Browser GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lon: longitude });
        
        // Reverse Geocode via Nominatim (OpenStreetMap)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setCityData(data.address);
      }, async () => {
        // 2. Fallback to IP Geolocation if GPS denied
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        setLocation({ lat: data.latitude, lon: data.longitude });
        setCityData({ city: data.city, country: data.country_name });
      });
    }
  };

  useEffect(() => { detectLocation(); }, []);

  return { location, cityData };
};
