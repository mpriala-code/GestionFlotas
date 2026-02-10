
export enum MaintenanceStatus {
  UP_TO_DATE = 'Al día',
  PENDING = 'Pendiente',
  DELAYED = 'Atrasado'
}

export enum WorkStatus {
  ACTIVE = 'Activa',
  COMPLETED = 'Completada'
}

export enum TripType {
  HOME_TO_PAVILION = 'Casa→Pavellón',
  PAVILION_TO_HOME = 'Pavellón→Casa',
  WORKS = 'Obras',
  PERSONAL = 'Personal'
}

export type AuthRole = 'none' | 'worker' | 'admin';

export interface PriceRecord {
  id: string;
  date: string; // Effective starting date
  endDate?: string; // Optional ending date for the interval
  fuelPrice: number; // EUR per Liter
  costPerKm: number; // Extra operational cost per KM
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  notes: string;
  statusAtTime: MaintenanceStatus;
  type: 'Preventivo' | 'Correctivo' | 'Revisión ITV' | 'Otro';
}

export interface LoanInfo {
  active: boolean;
  totalAmount: number;
  monthlyFee: number;
  startDate: string;
  endDate: string;
  remainingAmount: number;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  vin: string;
  year: number;
  purchaseDate: string;
  kilometers: number;
  baseConsumption: number; // L/100km
  wearFactor: number; // percentage
  taxDate: string;
  taxAmount: number;
  nextGeneralPayment: string;
  insuranceCost: number;
  insuranceExpiry: string;
  itvDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  maintStatus: MaintenanceStatus;
  maintNotes: string;
  loan: LoanInfo;
  maintenanceHistory: MaintenanceRecord[];
}

export interface Worker {
  id: string;
  name: string;
  position: string;
  username: string;
  password: string;
}

export interface Work {
  id: string;
  name: string;
  address: string;
  status: WorkStatus;
}

export interface LogEntry {
  id: string;
  date: string;
  time: string;
  vehicleId: string;
  workerId: string;
  workId: string;
  tripType: TripType;
  startKm: number;
  endKm: number;
  distance: number;
  fuelConsumed: number;
  avgConsumption: number; // L/100km calculated for this trip
  notes: string;
}

export type TabType = 'dashboard' | 'vehicles' | 'workers' | 'works' | 'logs' | 'stats' | 'maintenance' | 'settings';
