import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Globe, Languages, Navigation } from 'lucide-react';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  
  // State for user preferences
  const [radius, setRadius] = useState(localStorage.getItem('searchRadius') || '50');
  const [selectedCountry, setSelectedCountry] = useState(localStorage.getItem('userCountry') || 'Global');
  const [countries, setCountries] = useState<{country_code: string, country_name: string}[]>([]);

  // 1. Load Global Country List from your new API
  useEffect(() => {
    fetch('/api/locations/countries')
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(err => console.error("Error loading countries:", err));
  }, []);

  // 2. Handle Language Change (Kurdish, Arabic, English)
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('userLanguage', lng);
  };

  // 3. Handle Radius Change
  const handleRadiusChange = (val: string) => {
    setRadius(val);
    localStorage.setItem('searchRadius', val);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8 pb-24">
      <h1 className="text-2xl font-bold border-b pb-4">{t('settings')}</h1>

      {/* Language Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <Languages size={20} />
          <h2>{t('language')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'ar', label: 'العربية' },
            { code: 'ku', label: 'کوردی (سۆرانی)' }
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`p-3 rounded-xl border transition-all ${
                i18n.language === lang.code 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Country Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <Globe size={20} />
          <h2>{t('country')}</h2>
        </div>
        <select 
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="Global">Global / All Countries</option>
          {countries.map(c => (
            <option key={c.country_code} value={c.country_code}>
              {c.country_name}
            </option>
          ))}
        </select>
      </section>

      {/* Radius Selection Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <Navigation size={20} />
          <h2>{t('job_search_radius')}</h2>
        </div>
        <div className="flex justify-between bg-gray-100 p-1 rounded-2xl">
          {['10', '25', '50', '100'].map((val) => (
            <button
              key={val}
              onClick={() => handleRadiusChange(val)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                radius === val 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {val}km
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 px-2 italic">
          {t('radius_hint', { radius })} 
          {/* Note: "Showing jobs within {{radius}}km of your location" in your JSON */}
        </p>
      </section>

      {/* Save Button (Optional: often auto-saves to localStorage) */}
      <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">
        {t('save_preferences')}
      </button>
    </div>
  );
};

export default SettingsPage;
