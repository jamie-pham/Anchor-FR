// USGS Earthquake Hazards Program API
// Real API: https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude={lat}&longitude={lng}&maxradiuskm={radius}&minmagnitude=3&orderby=time&limit=20
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

import { USGSEarthquakeResponse, USGSEarthquakeFeature, Coordinates } from '../../types';

export async function fetchUSGSEarthquakes(
  location: Coordinates,
  radiusKm: number = 300,
  minMagnitude: number = 3.0
): Promise<USGSEarthquakeFeature[]> {
  // In production:
  // const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${location.lat}&longitude=${location.lng}&maxradiuskm=${radiusKm}&minmagnitude=${minMagnitude}&orderby=time&limit=20`;
  // const response = await axios.get<USGSEarthquakeResponse>(url);
  // return response.data.features;

  const now = Date.now();

  const mockResponse: USGSEarthquakeResponse = {
    type: 'FeatureCollection',
    metadata: {
      generated: now,
      url: `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${location.lat}&longitude=${location.lng}&maxradiuskm=${radiusKm}&minmagnitude=${minMagnitude}`,
      title: 'USGS Earthquakes',
      status: 200,
      api: '1.14.1',
      count: 2,
    },
    features: [
      {
        type: 'Feature',
        properties: {
          mag: 4.2,
          place: '87 km NE of location',
          time: now - 3600000,
          updated: now - 1800000,
          tz: null,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us2024abc001',
          detail: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us2024abc001&format=geojson',
          felt: 12,
          cdi: 3.2,
          mmi: 4.1,
          alert: null,
          status: 'reviewed',
          tsunami: 0,
          sig: 271,
          net: 'us',
          code: '2024abc001',
          ids: ',us2024abc001,',
          sources: ',us,',
          types: ',dyfi,origin,phase-data,',
          nst: 48,
          dmin: 0.612,
          rms: 0.52,
          gap: 78,
          magType: 'ml',
          type: 'earthquake',
          title: 'M 4.2 - 87 km NE of location',
        },
        geometry: {
          type: 'Point',
          coordinates: [location.lng + 0.7, location.lat + 0.5, 12.4],
        },
        id: 'us2024abc001',
      },
      {
        type: 'Feature',
        properties: {
          mag: 3.5,
          place: '142 km SW of location',
          time: now - 7200000,
          updated: now - 5400000,
          tz: null,
          url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us2024abc002',
          detail: 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us2024abc002&format=geojson',
          felt: 4,
          cdi: 2.1,
          mmi: 2.8,
          alert: null,
          status: 'reviewed',
          tsunami: 0,
          sig: 188,
          net: 'us',
          code: '2024abc002',
          ids: ',us2024abc002,',
          sources: ',us,',
          types: ',origin,phase-data,',
          nst: 31,
          dmin: 0.891,
          rms: 0.41,
          gap: 92,
          magType: 'ml',
          type: 'earthquake',
          title: 'M 3.5 - 142 km SW of location',
        },
        geometry: {
          type: 'Point',
          coordinates: [location.lng - 1.1, location.lat - 0.9, 8.7],
        },
        id: 'us2024abc002',
      },
    ],
  };

  return mockResponse.features.filter(f => f.properties.mag >= minMagnitude);
}
