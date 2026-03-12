export interface CarProps {
  id: number;
  make: string;
  model: string;
  year: number;
  trim: string;
  body_style: string;
  transmission?: string;
  fuel_type?: string;
  drive_type?: string;
  // Car-API2-da MPG doim ham bo'lmasligi mumkin, shuning uchun optional qilamiz
  city_mpg?: number;
  highway_mpg?: number;
  combination_mpg?: number;
}

export interface FilterProps {
  manufacturer?: string;
  year?: number;
  model?: string;
  limit?: number;
  fuel?: string;
}