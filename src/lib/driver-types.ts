export type DriverServiceZone = "makkah" | "madinah";
export type DriverVehicleType = "sedan" | "suv" | "hiace";
export type DriverRegistrationStatus = "pending_review";

export interface DriverRegistrationInput {
  idempotencyKey: string;
  fullName: string;
  phone: string;
  serviceZones: DriverServiceZone[];
  vehicleType: DriverVehicleType;
  vehicleModel: string;
  consent: true;
}

export interface StoredDriverRegistration {
  id: string;
  reference: string;
  createdAt: string;
  consentAt: string;
  fullName: string;
  phone: string;
  serviceZones: DriverServiceZone[];
  vehicleType: DriverVehicleType;
  vehicleModel: string;
  status: "pending_review";
}

export interface DriverRegistrationReceipt {
  id: string;
  reference: string;
  status: "pending_review";
}
