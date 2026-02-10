
import { Vehicle, Worker, Work, LogEntry, MaintenanceStatus, WorkStatus, TripType } from './types';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: '1',
    plate: '1234-ABC',
    model: 'Renault Master',
    type: 'Furgoneta',
    vin: 'VF1234567890ABCDE',
    year: 2021,
    purchaseDate: '2021-05-15',
    kilometers: 45000,
    baseConsumption: 8.5,
    wearFactor: 5,
    taxDate: '2024-03-10',
    taxAmount: 120,
    nextGeneralPayment: '2024-06-01',
    insuranceCost: 650,
    insuranceExpiry: '2024-08-15',
    itvDate: '2025-05-15',
    lastMaintenance: '2023-12-20',
    nextMaintenance: '2024-06-20',
    maintStatus: MaintenanceStatus.UP_TO_DATE,
    maintNotes: 'Cambio de aceite y filtros realizado.',
    loan: {
      active: true,
      totalAmount: 25000,
      monthlyFee: 420,
      startDate: '2021-06-01',
      endDate: '2026-06-01',
      remainingAmount: 1680
    },
    maintenanceHistory: [
      { id: 'm1', date: '2023-12-20', type: 'Preventivo', notes: 'Cambio de aceite, filtros y revisión de niveles.', statusAtTime: MaintenanceStatus.UP_TO_DATE },
      { id: 'm2', date: '2023-06-15', type: 'Revisión ITV', notes: 'Pasada sin defectos.', statusAtTime: MaintenanceStatus.UP_TO_DATE }
    ]
  },
  {
    id: '2',
    plate: '5678-DEF',
    model: 'Mercedes Sprinter',
    type: 'Furgoneta',
    vin: 'WDB987654321DEFGH',
    year: 2022,
    purchaseDate: '2022-02-10',
    kilometers: 32000,
    baseConsumption: 9.2,
    wearFactor: 3,
    taxDate: '2024-02-15',
    taxAmount: 145,
    nextGeneralPayment: '2024-05-15',
    insuranceCost: 800,
    insuranceExpiry: '2024-11-20',
    itvDate: '2026-02-10',
    lastMaintenance: '2024-01-05',
    nextMaintenance: '2024-07-05',
    maintStatus: MaintenanceStatus.UP_TO_DATE,
    maintNotes: 'Revisión frenos.',
    loan: {
      active: true,
      totalAmount: 32000,
      monthlyFee: 550,
      startDate: '2022-03-01',
      endDate: '2027-03-01',
      remainingAmount: 7150
    },
    maintenanceHistory: [
      { id: 'm3', date: '2024-01-05', type: 'Correctivo', notes: 'Sustitución de pastillas de freno delanteras.', statusAtTime: MaintenanceStatus.UP_TO_DATE }
    ]
  },
  {
    id: '3',
    plate: '9012-GHI',
    model: 'Ford Transit',
    type: 'Furgoneta',
    vin: 'WF011223344GHIJKL',
    year: 2019,
    purchaseDate: '2019-11-30',
    kilometers: 110000,
    baseConsumption: 8.8,
    wearFactor: 12,
    taxDate: '2024-04-12',
    taxAmount: 115,
    nextGeneralPayment: '2024-05-01',
    insuranceCost: 580,
    insuranceExpiry: '2024-06-30',
    itvDate: '2024-11-30',
    lastMaintenance: '2023-05-10',
    nextMaintenance: '2024-05-10',
    maintStatus: MaintenanceStatus.PENDING,
    maintNotes: 'Requiere cambio de neumáticos pronto.',
    loan: {
      active: false,
      totalAmount: 0,
      monthlyFee: 0,
      startDate: '',
      endDate: '',
      remainingAmount: 0
    },
    maintenanceHistory: [
      { id: 'm4', date: '2023-05-10', type: 'Preventivo', notes: 'Revisión general de los 100k km.', statusAtTime: MaintenanceStatus.UP_TO_DATE }
    ]
  }
];

export const INITIAL_WORKERS: Worker[] = [
  { id: 'w1', name: 'Antonio García', position: 'Conductor Senior', username: 'antonio', password: '123' },
  { id: 'w2', name: 'María Rodríguez', position: 'Logística', username: 'maria', password: '123' },
  { id: 'w3', name: 'Juan López', position: 'Conductor', username: 'juan', password: '123' }
];

export const INITIAL_WORKS: Work[] = [
  { id: 'o1', name: 'Obra Centro Ciudad', address: 'Calle Mayor 1, Madrid', status: WorkStatus.ACTIVE },
  { id: 'o2', name: 'Reforma Polígono', address: 'Av. Industrial 45, Leganés', status: WorkStatus.ACTIVE },
  { id: 'o3', name: 'Mantenimiento Vía Pública', address: 'Distintos puntos', status: WorkStatus.COMPLETED }
];

export const INITIAL_LOGS: LogEntry[] = [
  { 
    id: 'l1', 
    date: '2024-05-10', 
    time: '08:30',
    vehicleId: '1', 
    workerId: 'w1', 
    workId: 'o1', 
    tripType: TripType.WORKS,
    startKm: 44730,
    endKm: 44850,
    distance: 120, 
    fuelConsumed: 10.5, 
    avgConsumption: 8.75,
    notes: 'Transporte de material inicial.'
  },
  { 
    id: 'l2', 
    date: '2024-05-11', 
    time: '09:00',
    vehicleId: '2', 
    workerId: 'w3', 
    workId: 'o2', 
    tripType: TripType.WORKS,
    startKm: 31915,
    endKm: 32000,
    distance: 85, 
    fuelConsumed: 8.2, 
    avgConsumption: 9.65,
    notes: 'Desplazamiento a obra sur.'
  },
  { 
    id: 'l3', 
    date: '2024-05-12', 
    time: '08:15',
    vehicleId: '1', 
    workerId: 'w1', 
    workId: 'o1', 
    tripType: TripType.PAVILION_TO_HOME,
    startKm: 44850,
    endKm: 45000,
    distance: 150, 
    fuelConsumed: 13.1, 
    avgConsumption: 8.73,
    notes: 'Ruta de suministro habitual.'
  }
];
