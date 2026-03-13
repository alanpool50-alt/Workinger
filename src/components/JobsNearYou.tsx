import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Loader2, Briefcase } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company_name: string;
  location: string;
  distance: number;
  salary: string;
  type: string;
}

const JobsNearYou = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get radius from Settings (default to 50km if not set)
  const radius = localStorage.getItem('searchRadius') || '50';

  useEffect(() => {
    const fetchNearbyJobs = async () => {
      setLoading(true);
      
      // 1. Get Browser Geolocation
      if (!navigator.geolocation) {
        setError("Geolocation not supported");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // 2. Call the server API we built
            const response = await fetch(
              `/api/jobs/nearby?lat=${latitude}&lon=${longitude}&radius=${radius}`
            );
            const data = await response.json();
            setJobs(data);
          } catch (err) {
            setError("Failed to fetch nearby jobs");
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError("Location access denied. Please enable GPS in settings.");
          setLoading(false);
        }
      );
    };

    fetchNearbyJobs();
  }, [radius]); // Re-run if user changes radius in Settings

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>{t('detecting_location')}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
        <MapPin size={20} />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Navigation size={22} className="text-blue-600" />
          {t('jobs_near_you')}
        </h2>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {radius}km
        </span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Briefcase className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="text-gray-500">{t('no_jobs_found_radius')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                  <p className="text-blue-600 font-medium text-sm">{job.company_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                    {job.salary}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-gray-500 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-blue-500">
                  <span>{job.distance.toFixed(1)} km {t('away')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsNearYou;
