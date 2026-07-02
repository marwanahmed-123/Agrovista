import { useEffect, useState } from "react";
import { locationService } from "../services/locationService";

const govCache = new Map<string, string>();
const cityCache = new Map<string, Map<string, string>>();
let govPromise: Promise<void> | null = null;
const cityPromises = new Map<string, Promise<void>>();

async function resolve(locationId: string): Promise<string | null> {
  if (!govPromise) {
    govPromise = locationService.getGovernorates().then((govs) => {
      for (const g of govs) govCache.set(g._id, g.nameEn);
    });
  }
  await govPromise;

  const govCode = locationId.slice(0, 4);
  const govName = govCache.get(govCode);

  if (!cityCache.has(govCode) && !cityPromises.has(govCode)) {
    cityPromises.set(
      govCode,
      locationService.getCities(govCode).then((cities) => {
        const map = new Map<string, string>();
        for (const c of cities) map.set(c._id, c.nameEn);
        cityCache.set(govCode, map);
      }),
    );
  }
  if (cityPromises.has(govCode)) {
    await cityPromises.get(govCode)!;
  }

  const cityName = cityCache.get(govCode)?.get(locationId);
  if (cityName && govName) return `${cityName}, ${govName}`;
  if (cityName) return cityName;
  if (govName) return govName;
  return null;
}

export function useLocationName(locationId?: string | null) {
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!locationId) {
      setName(undefined);
      return;
    }

    let cancelled = false;
    setName(undefined);

    resolve(locationId).then((resolved) => {
      if (!cancelled) setName(resolved ?? locationId);
    });

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return name;
}

interface LocationNameProps {
  locationId?: string | null;
  region?: string | null;
}

export function LocationName({ locationId, region }: LocationNameProps) {
  const name = useLocationName(locationId);
  return <>{name ?? locationId ?? region ?? "Unknown"}</>;
}
