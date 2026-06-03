import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types';

export interface LocationState {
  location: Coordinates | null;
  locationName: string;
  error: string | null;
  loading: boolean;
  permissionStatus: Location.PermissionStatus | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    locationName: '',
    error: null,
    loading: true,
    permissionStatus: null,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setState(prev => ({ ...prev, permissionStatus: status }));
    return status === 'granted';
  }, []);

  const fetchLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState(prev => ({ ...prev, permissionStatus: status }));

      if (status !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Location permission denied. Anchor needs your location to check for nearby hazards.',
          }));
          return;
        }
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      // Reverse geocode to get a human-readable name
      let locationName = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
      try {
        const [geocoded] = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        if (geocoded) {
          const parts = [geocoded.city || geocoded.subregion, geocoded.region].filter(Boolean);
          if (parts.length > 0) locationName = parts.join(', ');
        }
      } catch {
        // Non-fatal — use coordinate string
      }

      setState({
        location: coords,
        locationName,
        error: null,
        loading: false,
        permissionStatus: 'granted',
      });
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Could not get your location: ${err.message}`,
      }));
    }
  }, [requestPermission]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    ...state,
    refresh: fetchLocation,
    requestPermission,
  };
}
