export type TeaType = 'Зелёный' | 'Чёрный' | 'Улун' | 'Пуэр' | 'Белый' | 'Травяной';

export interface Variant {
  grams: number;
  price: number;
}

export interface Tea {
  id: number;
  slug: string;
  name: string;
  type: TeaType;
  origin: string;
  color: string;
  description: string;
  notes: string[];
  brew: { temp: number; time: string };
  variants: Variant[];
  rating: number;
  inStock: boolean;
}

export interface CartLine {
  slug: string;
  grams: number;
  qty: number;
}
