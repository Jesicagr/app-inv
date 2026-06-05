type MeetinghouseCoordinates = {
  lat?: number;
  lng?: number;
};

type Bounds = {
  east: number;
  north: number;
  south: number;
  west: number;
};

type GenericRecord = Record<string, unknown>;

type MeetinghouseDetail = {
  address?: string;
  name?: string;
  wards?: string[];
  schedule?: string;
};

export type NormalizedMeetinghouse = {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  schedule: string | null;
  wards?: string[];
};

const ARGENTINA_BOUNDS: Bounds = {
  west: -73.7,
  south: -55.2,
  east: -53.6,
  north: -21.7,
};

const DEFAULT_MEETINGHOUSE_ENDPOINT =
  "https://maps.churchofjesuschrist.org/api/maps-proxy/v2/locations/clusters";
const DEFAULT_MEETINGHOUSE_DETAIL_BASE_URL =
  "https://maps.churchofjesuschrist.org/meetinghouses";
const DEFAULT_MEETINGHOUSE_TOKEN = "ncqmw6";
const detailCache = new Map<string, Promise<MeetinghouseDetail | null>>();

function buildExtentFromBounds(bounds: Bounds) {
  return `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
}

function buildExtent(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const west = lng - lngDelta;
  const south = lat - latDelta;
  const east = lng + lngDelta;
  const north = lat + latDelta;

  return buildExtentFromBounds({ west, south, east, north });
}

function buildMeetinghouseUrl(extent: string, zoom: number) {
  const endpoint =
    process.env.MEETINGHOUSE_API_URL ?? DEFAULT_MEETINGHOUSE_ENDPOINT;
  const token =
    process.env.MEETINGHOUSE_API_TOKEN ?? DEFAULT_MEETINGHOUSE_TOKEN;
  const url = new URL(endpoint);

  url.searchParams.set("extent", extent);
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("layers", "MEETINGHOUSE");
  url.searchParams.set("filters", "");
  url.searchParams.set("emphasize", "false");
  url.searchParams.set("icon", "21,21");
  url.searchParams.set("token", token);

  return url.toString();
}

function buildMeetinghouseDetailUrl(id: string) {
  const baseUrl =
    process.env.MEETINGHOUSE_DETAIL_BASE_URL ??
    DEFAULT_MEETINGHOUSE_DETAIL_BASE_URL;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/${id}`);
  url.searchParams.set("hold", "true");
  return url.toString();
}

function buildMeetinghouseDetailRscUrl(id: string) {
  const url = new URL(buildMeetinghouseDetailUrl(id));
  url.searchParams.set("_rsc", "detail");
  return url.toString();
}

function splitBounds(bounds: Bounds): Bounds[] {
  const midLng = (bounds.west + bounds.east) / 2;
  const midLat = (bounds.south + bounds.north) / 2;

  return [
    { west: bounds.west, south: bounds.south, east: midLng, north: midLat },
    { west: midLng, south: bounds.south, east: bounds.east, north: midLat },
    { west: bounds.west, south: midLat, east: midLng, north: bounds.north },
    { west: midLng, south: midLat, east: bounds.east, north: bounds.north },
  ];
}

function isRecord(value: unknown): value is GenericRecord {
  return typeof value === "object" && value !== null;
}

function getNestedRecord(
  source: GenericRecord,
  key: string,
): GenericRecord | null {
  const value = source[key];
  return isRecord(value) ? value : null;
}

function getString(source: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getNumber(source: GenericRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function extractCoordinates(item: GenericRecord): MeetinghouseCoordinates {
  const directLat = getNumber(item, ["latitude", "lat"]);
  const directLng = getNumber(item, ["longitude", "lng", "lon"]);

  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng };
  }

  if (Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
    const [lng, lat] = item.coordinates;

    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }

  const coordinatesRecord =
    getNestedRecord(item, "coordinates") ??
    getNestedRecord(item, "coordinate") ??
    getNestedRecord(item, "location") ??
    getNestedRecord(item, "center") ??
    getNestedRecord(item, "position");

  if (coordinatesRecord) {
    const nestedLat = getNumber(coordinatesRecord, ["latitude", "lat"]);
    const nestedLng = getNumber(coordinatesRecord, ["longitude", "lng", "lon"]);

    if (nestedLat !== null && nestedLng !== null) {
      return { lat: nestedLat, lng: nestedLng };
    }
  }

  const geometry = getNestedRecord(item, "geometry");
  if (geometry && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }

  return { lat: undefined, lng: undefined };
}

function extractAddress(item: GenericRecord) {
  const directAddress = getString(item, [
    "formattedAddress",
    "address",
    "streetAddress",
    "address1",
  ]);

  if (directAddress) {
    return directAddress;
  }

  const addressRecord = getNestedRecord(item, "address");
  if (addressRecord) {
    return (
      getString(addressRecord, [
        "formattedAddress",
        "address1",
        "streetAddress",
      ]) ?? "Sin direccion"
    );
  }

  return "Sin direccion";
}

function extractItems(payload: unknown): GenericRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const arrayKeys = [
    "locations",
    "results",
    "clusters",
    "items",
    "features",
    "data",
    "markers",
  ];

  for (const key of arrayKeys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findFirstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    const value = normalizeText(match?.[1]);
    if (value) {
      return value;
    }
  }

  return null;
}

function extractDetailFromJsonValue(value: unknown): MeetinghouseDetail {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const detail = extractDetailFromJsonValue(entry);
      if (detail.name || detail.address) {
        return detail;
      }
    }
    return {};
  }

  if (!isRecord(value)) {
    return {};
  }

  const name = getString(value, [
    "name",
    "title",
    "displayName",
    "propertyName",
    "meetinghouseName",
  ]);

  const address = getString(value, [
    "formattedAddress",
    "address",
    "streetAddress",
    "address1",
  ]);

  if (name || address) {
    return { name: normalizeText(name), address: normalizeText(address) };
  }

  const nestedKeys = Object.keys(value);
  for (const key of nestedKeys) {
    const detail = extractDetailFromJsonValue(value[key]);
    if (detail.name || detail.address) {
      return detail;
    }
  }

  return {};
}

function extractDetailFromStructuredData(text: string) {
  const scriptPattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = text.matchAll(scriptPattern);

  for (const match of matches) {
    const rawJson = normalizeText(match[1]);
    if (!rawJson) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const detail = extractDetailFromJsonValue(parsed);
      if (detail.name || detail.address) {
        return detail;
      }
    } catch {
      continue;
    }
  }

  return {};
}

function extractMeetinghouseDetail(text: string, id: string): MeetinghouseDetail {
  const structured = extractDetailFromStructuredData(text);
  if (structured.name || structured.address) {
    return structured;
  }

  // Nombre: igual que antes
  const name =
    findFirstMatch(text, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i,
      /<title>(.*?)<\/title>/i,
      /"displayName":"([^"]+)"/i,
      /"name":"([^"]+)"/i,
      /"meetinghouseName":"([^"]+)"/i,
    ]) ?? undefined;

  // Dirección: buscar <span class="address__text">...</span>
  let address = undefined;
  const addressMatch = text.match(/<span class="address__text">([\s\S]*?)<\/span>/i);
  if (addressMatch) {
    // Reemplazar <br> por coma y limpiar espacios
    address = addressMatch[1].replace(/<br\s*\/?\s*>/gi, ", ").replace(/\s+/g, " ").trim();
  } else {
    address = findFirstMatch(text, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /"formattedAddress":"([^"]+)"/i,
      /"streetAddress":"([^"]+)"/i,
      /"address1":"([^"]+)"/i,
    ]) ?? undefined;
  }

  // Wards: buscar <span class="location-link__name">...</span>
  const wards: string[] = [];
  const wardRegex = /<span class="location-link__name">([\s\S]*?)<\/span>/gi;
  let wardMatch;
  while ((wardMatch = wardRegex.exec(text)) !== null) {
    const wardName = normalizeText(wardMatch[1]);
    if (wardName) wards.push(wardName);
  }

  // Horarios: igual que antes
  let schedule = findFirstMatch(text, [
    /domingo\s+\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/i,
    /horarios? de apertura:? ([^<]+)/i,
  ]);

  return {
    name: name && !name.includes(id) ? name : name ?? undefined,
    address,
    wards: wards.length > 0 ? wards : undefined,
    schedule: schedule ?? undefined,
  };
}

async function fetchText(url: string, headers: Record<string, string>) {
  const response = await fetch(url, {
    method: "GET",
    cache: "force-cache",
    headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.text();
}

async function fetchMeetinghouseDetail(id: string): Promise<MeetinghouseDetail | null> {
  const cached = detailCache.get(id);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    try {
      const commonHeaders = {
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Origin: "https://maps.churchofjesuschrist.org",
        Referer: "https://maps.churchofjesuschrist.org/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      };

      const htmlText = await fetchText(buildMeetinghouseDetailUrl(id), {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...commonHeaders,
      });

      if (htmlText) {
        const detail = extractMeetinghouseDetail(htmlText, id);
        if (detail.name || detail.address) {
          return detail;
        }
      }

      const rscText = await fetchText(buildMeetinghouseDetailRscUrl(id), {
        Accept: "text/x-component, */*",
        RSC: "1",
        ...commonHeaders,
      });

      if (!rscText) {
        return null;
      }

      const rscDetail = extractMeetinghouseDetail(rscText, id);
      return rscDetail.name || rscDetail.address ? rscDetail : null;
    } catch {
      return null;
    }
  })();

  detailCache.set(id, promise);
  return promise;
}

function normalizeMeetinghouse(
  item: GenericRecord,
  index: number,
): NormalizedMeetinghouse {
  const coordinates = extractCoordinates(item);
  const address = extractAddress(item);
  const rawLocationId = Array.isArray(item.locations)
    ? item.locations.find((value): value is string => typeof value === "string")
    : null;
  const normalizedLocationId = rawLocationId?.replace(/^MEETINGHOUSE:/, "") ?? null;
  const count =
    Array.isArray(item.counts) && item.counts.length > 0 && isRecord(item.counts[0])
      ? getNumber(item.counts[0], ["count"])
      : null;
  const fallbackName =
    count && count > 1
      ? `Cluster de capillas (${count})`
      : normalizedLocationId
        ? `Capilla ${normalizedLocationId}`
        : "Capilla sin nombre";

  // Fallbacks más amigables
  const id = getString(item, ["id", "unitId", "entityId", "markerId"]) ?? normalizedLocationId ?? `meetinghouse-${index}`;
  let name = getString(item, ["name", "title", "displayName", "propertyName"]);
  if (!name) {
    if (normalizedLocationId) {
      name = `Capilla ${normalizedLocationId}`;
    } else if (count && count > 1) {
      name = `Cluster de capillas (${count})`;
    } else {
      name = "Capilla sin nombre";
    }
  }
  let addr = address;
  if (!addr || addr === normalizedLocationId) {
    addr = "Dirección no disponible";
  }
  return {
    id,
    name,
    address: addr,
    coordinates: {
      lat: typeof coordinates.lat === "number" && Number.isFinite(coordinates.lat) ? coordinates.lat : null,
      lng: typeof coordinates.lng === "number" && Number.isFinite(coordinates.lng) ? coordinates.lng : null,
    },
    schedule: getString(item, ["meetingTimes", "schedule"]),
  };
}

async function enrichMeetinghouses(
  meetinghouses: NormalizedMeetinghouse[],
): Promise<NormalizedMeetinghouse[]> {
  return Promise.all(
    meetinghouses.map(async (meetinghouse) => {
      const detail = await fetchMeetinghouseDetail(meetinghouse.id);
      let name = meetinghouse.name;
      let address = meetinghouse.address;
      let wards = meetinghouse.wards;
      let schedule = meetinghouse.schedule;
      if (detail) {
        if (detail.name && !/Centro de reuniones|Localizador de centros/i.test(detail.name)) {
          name = detail.name;
        }
        if (detail.address && !/MEETINGHOUSE:/i.test(detail.address)) {
          address = detail.address;
        }
        if (detail.wards && detail.wards.length > 0) {
          wards = detail.wards;
        }
        if (detail.schedule) {
          schedule = detail.schedule;
        }
      }
      // Fallbacks más amigables
      if (!name) name = "Capilla sin nombre";
      if (!address) address = "Dirección no disponible";
      return {
        ...meetinghouse,
        name,
        address,
        wards,
        schedule,
      };
    })
  );
}

async function fetchClusterPayload(extent: string, zoom: number) {
  const response = await fetch(buildMeetinghouseUrl(extent, zoom), {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      Origin: "https://maps.churchofjesuschrist.org",
      Referer: "https://maps.churchofjesuschrist.org/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      "x-maps-client": "mapsClient",
      "x-maps-version": "3.0.0",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const details = errorBody.slice(0, 240);

    throw new Error(
      `Endpoint de capillas respondio ${response.status} ${response.statusText}${details ? `: ${details}` : ""}`,
    );
  }

  return (await response.json()) as unknown;
}

function isResolvableSingle(item: GenericRecord) {
  const count =
    Array.isArray(item.counts) && item.counts.length > 0 && isRecord(item.counts[0])
      ? getNumber(item.counts[0], ["count"])
      : null;
  const locationCount = Array.isArray(item.locations) ? item.locations.length : 0;

  return count === 1 && locationCount <= 1;
}

async function fetchMeetinghousesByBounds(
  bounds: Bounds,
  depth = 0,
): Promise<NormalizedMeetinghouse[]> {
  const zoom = Math.min(12, 5 + depth);
  const payload = await fetchClusterPayload(buildExtentFromBounds(bounds), zoom);
  const items = extractItems(payload);

  if (items.length === 0) {
    return [];
  }

  if (depth >= 6) {
    return items.map(normalizeMeetinghouse);
  }

  const singles = items.filter(isResolvableSingle);
  const clusters = items.filter((item) => !isResolvableSingle(item));

  if (clusters.length === 0) {
    return items.map(normalizeMeetinghouse);
  }

  const subdivided = await Promise.all(
    splitBounds(bounds).map((part) => fetchMeetinghousesByBounds(part, depth + 1)),
  );

  const merged = [
    ...singles.map(normalizeMeetinghouse),
    ...subdivided.flat(),
  ];

  return dedupeMeetinghouses(merged);
}

function dedupeMeetinghouses(meetinghouses: NormalizedMeetinghouse[]) {
  const seen = new Map<string, NormalizedMeetinghouse>();

  for (const meetinghouse of meetinghouses) {
    if (!seen.has(meetinghouse.id)) {
      seen.set(meetinghouse.id, meetinghouse);
    }
  }

  return Array.from(seen.values());
}

/**
 * Obtiene capillas cercanas desde el endpoint interno que usa el mapa web.
 */
export async function fetchNearbyMeetinghouses(
  lat: number,
  lng: number,
  radiusKm = 15,
): Promise<NormalizedMeetinghouse[]> {
  const payload = await fetchClusterPayload(buildExtent(lat, lng, radiusKm), radiusKm <= 5 ? 14 : 12);
  const items = extractItems(payload);

  if (items.length === 0) {
    const keys = isRecord(payload) ? Object.keys(payload).join(", ") : "sin claves";
    throw new Error(
      `La respuesta de capillas no trajo una lista reconocible. Claves detectadas: ${keys}`,
    );
  }

  const normalized = items.map(normalizeMeetinghouse);
  return enrichMeetinghouses(normalized);
}

export async function fetchArgentinaMeetinghouses() {
  const nationwide = await fetchMeetinghousesByBounds(ARGENTINA_BOUNDS);
  return enrichMeetinghouses(dedupeMeetinghouses(nationwide));
}
