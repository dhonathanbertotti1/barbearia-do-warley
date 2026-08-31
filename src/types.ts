export type UserRole = 'owner' | 'professional' | 'client';

export interface BarberServiceConfig {
  serviceId: string;
  enabled: boolean;
  customPrice?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  points?: number; // For client loyalty
  specialty?: string; // For barbers
  rating?: number; // For barbers
  ratingCount?: number; // For barbers
  birthDate?: string; // Client's Date of Birth
  password?: string; // Access password for staff/owner
  commissionPercent?: number; // Custom commission rate for barbers (percentage)
  barberServices?: BarberServiceConfig[]; // Custom services of this barber
  absences?: string[]; // Array of dates (YYYY-MM-DD) when barber is absent
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description: string;
  category: string;
  popular?: boolean;
  iconName?: string; // e.g. 'Scissors', 'Sparkles'
}

export type AppointmentStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão';
  products?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalPrice?: number;
}

export interface Review {
  id: string;
  appointmentId?: string;
  clientId: string;
  clientName: string;
  barberId: string;
  barberName: string;
  stars: number;
  comment: string;
  date: string;
}

export interface FinancialSummary {
  todayRevenue: number;
  percentChange: number;
  totalClients: number;
  totalServicesThisMonth: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ComandaItem {
  id: string;
  name: string;
  type: 'service' | 'product';
  price: number;
  quantity: number;
}

export interface Comanda {
  id: string;
  code: string;
  clientName: string;
  barberId: string;
  barberName: string;
  items: ComandaItem[];
  status: 'open' | 'closed';
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão';
  createdAt: string;
  totalPrice: number;
}
