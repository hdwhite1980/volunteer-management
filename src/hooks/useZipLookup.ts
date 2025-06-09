import { useState, useRef } from 'react';

interface ZipData {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

/**
 * Hook to fetch city/state/coords from a US 5‑digit ZIP.
 * Caches results in-memory so repeated look‑ups are instant.
 */
export function useZipLookup() {
  const cache = useRef<Record<string, ZipData>>({});
  const [data, setData] = useState<ZipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (zip: string) => {
    if (!/^[0-9]{5}$/.test(zip)) {
      setData(null);
      setError(null);
      return;
    }

    // hit cache first
    if (cache.current[zip]) {
      setData(cache.current[zip]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (res.status === 404) {
        throw new Error('ZIP not found');
      }
      if (!res.ok) {
        throw new Error('Service unavailable');
      }

      const json = await res.json();
      const place = json.places[0];

      const payload: ZipData = {
        city: place['place name'],
        state: place['state abbreviation'],
        lat: parseFloat(place.latitude),
        lon: parseFloat(place.longitude),
      };

      cache.current[zip] = payload;
      setData(payload);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, lookup };
}
