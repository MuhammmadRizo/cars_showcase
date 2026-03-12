import { CarProps, FilterProps } from "../types";

// Ijara narxini hisoblash (city_mpg bo'lmasa, default qiymat beramiz)
export const calculateCarRent = (city_mpg: number | undefined, year: number) => {
  const basePricePerDay = 50;
  const mileageFactor = 0.1;
  const ageFactor = 0.05;

  // Agar API city_mpg qaytarmasa, o'rtacha 25 deb olamiz
  const mpg = city_mpg ? city_mpg : 25;

  const mileageRate = mpg * mileageFactor;
  const ageRate = (new Date().getFullYear() - year) * ageFactor;

  const rentalRatePerDay = basePricePerDay + mileageRate + ageRate;

  return rentalRatePerDay.toFixed(0);
};

export const updateSearchParams = (type: string, value: string) => {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set(type, value);
  return `${window.location.pathname}?${searchParams.toString()}`;
};

export const deleteSearchParams = (type: string) => {
  const newSearchParams = new URLSearchParams(window.location.search);
  newSearchParams.delete(type.toLowerCase());
  return `${window.location.pathname}?${newSearchParams.toString()}`;
};

// FETCH FUNKSIYASI - Car-API2 uchun maxsus optimizatsiya qilingan
export async function fetchCars(filters: FilterProps) {
  const { manufacturer, year, model, limit } = filters;

  const headers: HeadersInit = {
    "X-RapidAPI-Key": "7141bf1d94msh6ad65154c59a99ep17aa8djsn0741be612cfc",
    "X-RapidAPI-Host": "car-api2.p.rapidapi.com",
    "Content-Type": "application/json",
  };

  const url = new URL("https://car-api2.p.rapidapi.com/api/models");

  // Parametrlarni Car-API2 hujjatiga moslash
  if (manufacturer) url.searchParams.append('make', manufacturer);
  if (model) url.searchParams.append('model', model);
  if (year) url.searchParams.append('year', year.toString());
  url.searchParams.append('limit', (limit || 10).toString());

  try {
    const response = await fetch(url.toString(), { headers });
    const result = await response.json();

    // DIQQAT: API natijasini bizning CarProps formatiga o'giramiz
    // Car-API2 da ba'zan 'make' o'rniga 'make_name' yoki ichma-ich obyekt keladi
    return result.data.map((item: any) => ({
      // Agar item.make obyekt bo'lsa item.make.name ni oladi, aks holda o'zini
      make: item.make?.name || item.make || "Toyota",
      // model: item.name || item.model || "Corolla",
      year: item.year || 2022,
      city_mpg: item.city_mpg || 25,
      transmission: item.transmission || "Automatic",
      drive_type: item.drive || "fwd",
      fuel_type: item.fuel_type || "Gas",
    }));

  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

export const generateCarImageUrl = (car: CarProps, angle?: string) => {
  const url = new URL("https://cdn.imagin.studio/getimage");

  // Destructuring paytida default qiymat beramiz
  const { make, model = "", year } = car;

  url.searchParams.append('customer', process.env.NEXT_PUBLIC_IMAGIN_API_KEY || 'hrjavascript-mastery');
  url.searchParams.append('make', make);

  // Model mavjudligini tekshiramiz, aks holda bo'sh string qaytaramiz
  const modelFamily = model ? model.split(" ")[0] : "";
  url.searchParams.append('modelFamily', modelFamily);

  url.searchParams.append('zoomType', 'fullscreen');
  url.searchParams.append('modelYear', `${year}`);

  if (angle) url.searchParams.append('angle', `${angle}`);

  return `${url}`;
}