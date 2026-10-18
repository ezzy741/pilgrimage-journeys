export type BookingZone = "makkah" | "madinah";
export type BookingVehicle = "sedan" | "suv" | "hiace";
export type BookingStatus = "pending_review" | "quote_requested";
export type TripStatus =
  | "pending_review"
  | "quote_requested"
  | "confirmed"
  | "driver_assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface BookingTrackingStatus {
  reference: string;
  status: TripStatus;
  updatedAt: string;
  driverDisplayName: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
}

export interface BookingPoint {
  lat: number;
  lng: number;
}

export interface BookingInput {
  idempotencyKey: string;
  customerName: string;
  phone: string;
  zone: BookingZone;
  vehicle: BookingVehicle;
  stopIds: string[];
  pickupText: string;
  departure: BookingPoint | null;
  destination: BookingPoint | null;
  pickupAt: string;
  notes: string;
  promoCode: string;
  consent: true;
}

export interface BookingFareSnapshot {
  base: number;
  distance: number;
  surge: number;
  discount: number;
  total: number;
  currency: "SAR";
}

export interface StoredBooking extends Omit<BookingInput, "idempotencyKey"> {
  id: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
  consentAt: string;
  status: BookingStatus;
  estimatedFare: number | null;
  currency: "SAR";
  tripStatus: TripStatus;
  driverDisplayName: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
}

export interface BookingReceipt {
  id: string;
  reference: string;
  status: BookingStatus;
  estimatedFare: number | null;
  currency: "SAR";
  trackingToken?: string;
}
