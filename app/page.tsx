"use client";

import { CarCard, CustomFilter, Hero, SearchBar, ShowMore } from "@/components";
import { fetchCars } from "@/utils";
import { fuels, yearsOfProduction } from "@/constants";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CarProps } from "@/types";

export default function Home() {
  const [allCars, setAllCars] = useState<CarProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");
  const [year, setYear] = useState(2023);
  const [limit, setLimit] = useState(10);

  const getCars = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchCars({
        manufacturer: manufacturer || "BMW", // default to BMW so page loads with data
        year: year || 2023,
        fuel: fuel || "",
        limit: limit || 10,
        model: model || "",
      });

      if (!Array.isArray(result) || result.length === 0) {
        setError("No vehicles found. Try a different search.");
        setAllCars([]);
      } else {
        setAllCars(result);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setAllCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCars();
  }, [fuel, year, limit, manufacturer, model]);

  const isDataEmpty = !Array.isArray(allCars) || allCars.length < 1;

  return (
    <main className="overflow-hidden">
      <Hero />

      <div className="mt-12 padding-x padding-y max-width" id="discover">
        <div className="home__text-container">
          <h1 className="text-4xl font-extrabold">Car Catalogue</h1>
          <p>Explore vehicles from the TecDoc catalog</p>
        </div>

        <div className="home__filters">
          <SearchBar setManufacturer={setManufacturer} setModel={setModel} />
          <div className="home__filter-container">
            <CustomFilter title="fuel" options={fuels} setFilter={setFuel} />
            <CustomFilter title="year" options={yearsOfProduction} setFilter={setYear} />
          </div>
        </div>

        {loading ? (
          <div className="mt-16 w-full flex-center">
            <Image
              src="/loading.svg"
              width={50}
              height={50}
              alt="loader"
              className="object-contain"
            />
          </div>
        ) : !isDataEmpty ? (
          <section>
            <div className="home__cars-wrapper">
              {allCars.map((car: CarProps, index: number) => (
                <CarCard car={car} key={`${car.make}-${car.model}-${index}`} />
              ))}
            </div>

            <ShowMore
              pageNumber={limit / 10}
              isNext={limit > allCars.length}
              setLimit={setLimit}
            />
          </section>
        ) : (
          <div className="home__error-container">
            <h2 className="text-black text-xl font-bold">Oops, no results</h2>
            <p className="text-gray-500">{error || "Try searching for BMW, AUDI, or TOYOTA"}</p>
          </div>
        )}
      </div>
    </main>
  );
}
