import { CarProps, FilterProps } from "@/types";

const RAPIDAPI_KEY = "27485dded7mshf3b18347dc10d15p11f7e4jsn82d99ff9f484";
const RAPIDAPI_HOST = "tecdoc-catalog.p.rapidapi.com";
const BASE_URL = "https://tecdoc-catalog.p.rapidapi.com";

const headers = {
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": RAPIDAPI_HOST,
};

// Helper: tries every known TecDoc response shape and returns an array
function extractArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data?.array)) return json.data.array;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.array)) return json.array;
  if (Array.isArray(json?.result)) return json.result;
  if (Array.isArray(json?.manufacturers)) return json.manufacturers;
  if (Array.isArray(json?.models)) return json.models;
  if (Array.isArray(json?.vehicles)) return json.vehicles;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

// Step 1: Get all manufacturers
export async function fetchManufacturers(): Promise<any[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/getManufacturers?lang=en&countryId=0&linkingTargetType=P`,
      { headers }
    );

    console.log("📡 fetchManufacturers HTTP status:", res.status);

    if (!res.ok) {
      console.error("❌ fetchManufacturers failed:", res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    console.log("📦 fetchManufacturers RAW JSON keys:", Object.keys(json));
    console.log("📦 fetchManufacturers RAW JSON (first 500 chars):", JSON.stringify(json).slice(0, 500));

    const arr = extractArray(json);
    console.log("✅ fetchManufacturers parsed count:", arr.length);
    if (arr.length > 0) console.log("✅ fetchManufacturers first item:", arr[0]);

    return arr;
  } catch (err) {
    console.error("💥 fetchManufacturers exception:", err);
    return [];
  }
}

// Step 2: Get models by manufacturerId
export async function fetchModels(manuId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/getModels?lang=en&countryId=0&linkingTargetType=P&manuId=${manuId}`,
      { headers }
    );

    console.log(`📡 fetchModels [manuId=${manuId}] HTTP status:`, res.status);

    if (!res.ok) {
      console.error("❌ fetchModels failed:", res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    console.log("📦 fetchModels RAW JSON (first 500 chars):", JSON.stringify(json).slice(0, 500));

    const arr = extractArray(json);
    console.log(`✅ fetchModels parsed count for manuId=${manuId}:`, arr.length);
    if (arr.length > 0) console.log("✅ fetchModels first item:", arr[0]);

    return arr;
  } catch (err) {
    console.error("💥 fetchModels exception:", err);
    return [];
  }
}

// Step 3: Get vehicles by modelId
export async function fetchVehiclesByModel(manuId: number, modelId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/getVehicles?lang=en&countryId=0&linkingTargetType=P&manuId=${manuId}&modelId=${modelId}`,
      { headers }
    );

    console.log(`📡 fetchVehicles [manuId=${manuId}, modelId=${modelId}] HTTP status:`, res.status);

    if (!res.ok) {
      console.error("❌ fetchVehicles failed:", res.status, res.statusText);
      return [];
    }

    const json = await res.json();
    console.log("📦 fetchVehicles RAW JSON (first 500 chars):", JSON.stringify(json).slice(0, 500));

    const arr = extractArray(json);
    console.log(`✅ fetchVehicles parsed count:`, arr.length);
    if (arr.length > 0) console.log("✅ fetchVehicles first item:", arr[0]);

    return arr;
  } catch (err) {
    console.error("💥 fetchVehicles exception:", err);
    return [];
  }
}

// Main fetch function
export async function fetchCars(filters: FilterProps): Promise<CarProps[]> {
  const { manufacturer, year, model, limit, fuel } = filters;

  console.log("🚗 fetchCars called with:", filters);

  const manufacturers = await fetchManufacturers();

  if (!manufacturers.length) {
    console.warn("⚠️ No manufacturers returned from API");
    return [];
  }

  // Detect field name for manufacturer id and name dynamically
  const sample = manufacturers[0];
  const idKey = "manuId" in sample ? "manuId" : "manufacturerId" in sample ? "manufacturerId" : "id";
  const nameKey = "manuName" in sample ? "manuName" : "manufacturerName" in sample ? "manufacturerName" : "name";

  console.log(`🔑 Detected keys — id: "${idKey}", name: "${nameKey}"`);
  console.log("🏭 Sample manufacturer:", sample);

  const matchedManus = manufacturer
    ? manufacturers.filter((m) =>
      String(m[nameKey]).toLowerCase().includes(manufacturer.toLowerCase())
    )
    : manufacturers.slice(0, 3);

  console.log(`🔍 Matched manufacturers (${matchedManus.length}):`, matchedManus.map((m) => m[nameKey]));

  if (!matchedManus.length) return [];

  const allCars: CarProps[] = [];

  for (const manu of matchedManus) {
    if (allCars.length >= limit) break;

    const manuId = manu[idKey];
    const manuName = manu[nameKey];

    const models = await fetchModels(manuId);
    if (!models.length) {
      console.warn(`⚠️ No models for ${manuName} (id=${manuId})`);
      continue;
    }

    // Detect model field names dynamically
    const modSample = models[0];
    const modIdKey = "modelId" in modSample ? "modelId" : "id";
    const modNameKey = "modelname" in modSample ? "modelname" : "name" in modSample ? "name" : "modelName";
    const yearFromKey = "yearOfConstrFrom" in modSample ? "yearOfConstrFrom" : "yearFrom";
    const yearToKey = "yearOfConstrTo" in modSample ? "yearOfConstrTo" : "yearTo";

    console.log(`🔑 Model keys — id: "${modIdKey}", name: "${modNameKey}", yearFrom: "${yearFromKey}"`);

    const matchedModels = model
      ? models.filter((m: any) =>
        String(m[modNameKey]).toLowerCase().includes(model.toLowerCase())
      )
      : models;

    for (const mod of matchedModels) {
      if (allCars.length >= limit) break;

      if (year) {
        const from = parseInt(mod[yearFromKey]) || 0;
        const to = parseInt(mod[yearToKey]) || 9999;
        if (year < from || year > to) continue;
      }

      const vehicles = await fetchVehiclesByModel(manuId, mod[modIdKey]);

      if (vehicles.length > 0) {
        for (const v of vehicles) {
          if (allCars.length >= limit) break;

          if (fuel && v.fuelType && !v.fuelType.toLowerCase().includes(fuel.toLowerCase())) {
            continue;
          }

          allCars.push({
            make: manuName,
            model: mod[modNameKey] ?? "Unknown",
            year: parseInt(mod[yearFromKey]) || year || 2020,
            fuel_type: v.fuelType ?? v.fuel_type ?? fuel ?? "petrol",
            city_mpg: v.cityMpg ?? v.city_mpg ?? 28,
            highway_mpg: v.highwayMpg ?? v.highway_mpg ?? 35,
            combination_mpg: v.combinationMpg ?? 31,
            cylinders: v.cylinders ?? 4,
            displacement: v.displacement ?? 2.0,
            drive: v.driveType ?? v.drive ?? "fwd",
            transmission: v.transmission ?? "a",
            class: v.bodyType ?? v.class ?? "sedan",
            enginePower: v.enginePower ?? v.power ?? "",
            engineType: v.engineType ?? "",
            vehicleId: String(v.carId ?? v.vehicleId ?? v.id ?? mod[modIdKey]),
          });
        }
      } else {
        // Fallback: use model data directly
        allCars.push({
          make: manuName,
          model: mod[modNameKey] ?? "Unknown",
          year: parseInt(mod[yearFromKey]) || year || 2020,
          fuel_type: fuel ?? "petrol",
          city_mpg: 28,
          highway_mpg: 35,
          combination_mpg: 31,
          cylinders: 4,
          displacement: 2.0,
          drive: "fwd",
          transmission: "a",
          class: "sedan",
          enginePower: "",
          engineType: "",
          vehicleId: String(mod[modIdKey]),
        });
      }
    }
  }

  console.log(`🏁 fetchCars returning ${allCars.length} cars`);
  return allCars.slice(0, limit);
}

export const calculateCarRent = (city_mpg: number, year: number) => {
  const basePricePerDay = 50;
  const mileageFactor = 0.1;
  const ageFactor = 0.05;
  const mileageRate = city_mpg * mileageFactor;
  const ageRate = (new Date().getFullYear() - year) * ageFactor;
  const rentalRatePerDay = basePricePerDay + mileageRate + ageRate;
  return rentalRatePerDay.toFixed(0);
};

export const generateCarImageUrl = (car: CarProps, angle?: string) => {
  const url = new URL("https://cdn.imagin.studio/getimage");
  const { make, year, model } = car;
  url.searchParams.append("customer", "hrjavascript-mastery");
  url.searchParams.append("make", make);
  url.searchParams.append("modelFamily", model.split(" ")[0]);
  url.searchParams.append("zoomType", "fullscreen");
  url.searchParams.append("modelYear", `${year}`);
  url.searchParams.append("angle", `${angle}`);
  return `${url}`;
};

export const updateSearchParams = (type: string, value: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set(type, value);
  const newPathname = `${window.location.pathname}?${searchParams.toString()}`;
  return newPathname;
};