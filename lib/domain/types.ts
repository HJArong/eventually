export type Unit = "per_pax" | "per_item" | "flat" | "per_hour";

export type RequestedService = {
  serviceId: string;
  name: string;
  qty: number;
  unit: Unit;
  pricePhp: number;
};

export type QuoteLine = { label: string; qty: number; unitPricePhp: number };
