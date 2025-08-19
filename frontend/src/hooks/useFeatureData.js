import { useQuery } from '@tanstack/react-query';

const FEATURE_URL = 'https://p13n.adobe.io/fg/api/v3/feature?clientId=dc-prod-virgoweb&meta=false';

async function fetchFeatureData() {
  const res = await fetch(FEATURE_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Feature API failed: ${res.status} ${text || ''}`.trim());
  }
  return res.json();
}

export function useFeatureData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featureData'],
    queryFn: fetchFeatureData,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes (v5 replacement for cacheTime)
    // Ensure UI interactions like tab switches don't cause refetches
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return { data, isLoading, error };
}
