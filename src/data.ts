import { User, Service, Appointment, Review } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'warley',
    name: 'Warley Ferreira',
    email: 'warley@gmail.com',
    phone: '(11) 99999-1111',
    role: 'owner',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-qs2tLe6TQuJb3FzO543aOA8k9xtqh6j6xLzzpmcLcqtJnhSvmP2tfN72supU9PDONAUPmll_u_naFPYBhhMDrZwrEjQyKIDa0kAEwLbTfvwkWtoRR6aBD0ukQZzv_7mbpsApi6Vq6iq5lRcsjCdn1fbm5iTXZIY-cZZyer4J_Qi6aqWoVcriDon9OLRxNPzQ0uUlVJENJmlMpUpC04JREoRqItQp6xShOMXGODKXTIhvQ_vyTyQJ-oT8yFLPlJQsKLDP4D396CdC',
    specialty: 'Master Barber',
    rating: 5.0,
    ratingCount: 3
  },
  {
    id: 'kauan',
    name: 'Kauan Mendes',
    email: 'kauan@gmail.com',
    phone: '(11) 98888-2222',
    role: 'professional',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    specialty: 'Barbeiro de Corte & Fade',
    rating: 4.8,
    ratingCount: 2
  },
  {
    id: 'luiz',
    name: 'Luiz Gabriel',
    email: 'luiz@gmail.com',
    phone: '(11) 97777-3333',
    role: 'professional',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    specialty: 'Especialista em Barba & Design',
    rating: 5.0,
    ratingCount: 2
  },
  {
    id: 'ricardo',
    name: 'Ricardo Ferreira',
    email: 'ricardo.f@email.com',
    phone: '(11) 98765-4321',
    role: 'client',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQFM870Nqntq9wR3UcK8owdCkBFrweYg6dxYGiHkMZ_AEdRtSuR6XJpsrv0ikCboyWrEgCILPy554uXT9zEO_H6nfkd9WNUpqhKhqdSdKhbZyPYZTBipoG46WsqEy8w5hNkmrJmpuWcieTcnWHXftx_c1ZIVgbQmzY3jqRetlVI4KzPibKMpxgUbSY4tuCstfhyi42QHtT3IPBMjIfqOY18HEoC2Jued6JL81TBRx2dt3l5qcWNnkA3vuyAAiwZW7mBRIzUCaC-UWq',
    points: 850
  },
  {
    id: 'dhonathan',
    name: 'Dhonathan Elias Bertotti',
    email: 'dhonathanbertotti@gmail.com',
    phone: '(67) 99215-4634',
    role: 'owner',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFsuJASL7zxznEAJinYp199OvGAdHEcchyuTmWtfbAKhk-FIUCQRBv85SLGA2M-ursoNx_HueCymovotUK6E-vqeAZdPDO_13x_NMPNu2M3sVQse4pbG0XVDI3faBZLoWvNQ2miD7rcZsh6xIa6_eYRgfMiU3MgPVMe3UdiMs55r2BsQzr0X3bJEGVNZnTzO3LjAtGCf3lYxv33cqlw2iwNAzSLsuNGXkLAWmuFlXM4G1OJ7bktI6CRJZomMEGCglDmzzRJvYyz37W'
  }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'corte-moderno',
    name: 'Corte Moderno',
    price: 50.00,
    durationMin: 45,
    description: 'Corte personalizado com técnica de fade, acabamento premium e finalização com pomada modeladora de alta fixação.',
    category: 'Cabelo',
    popular: true,
    iconName: 'Scissors'
  },
  {
    id: 'barba-terapia',
    name: 'Barba Terapia',
    price: 40.00,
    durationMin: 30,
    description: 'Barba completa com toalha quente, óleos essenciais e massagem facial relaxante.',
    category: 'Barba',
    popular: true,
    iconName: 'Droplet'
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    price: 15.00,
    durationMin: 15,
    description: 'Design na navalha para realçar sua expressão com precisão e cuidado.',
    category: 'Estética',
    popular: false,
    iconName: 'Eye'
  },
  {
    id: 'pigmentacao',
    name: 'Pigmentação',
    price: 30.00,
    durationMin: 25,
    description: 'Acabamento artístico para realçar as linhas do corte e cobrir falhas com aspecto natural.',
    category: 'Cabelo',
    popular: false,
    iconName: 'Palette'
  },
  {
    id: 'platinado',
    name: 'Platinado',
    price: 120.00,
    durationMin: 90,
    description: 'Descoloração global com proteção capilar e matização premium.',
    category: 'Química',
    popular: false,
    iconName: 'Sparkles'
  },
  {
    id: 'limpeza-pele',
    name: 'Limpeza de Pele',
    price: 25.00,
    durationMin: 20,
    description: 'Máscara black com vapor de ozônio para remoção profunda de cravos e impurezas.',
    category: 'Estética',
    popular: false,
    iconName: 'Activity'
  },
  {
    id: 'corte-kids',
    name: 'Corte Kids',
    price: 45.00,
    durationMin: 30,
    description: 'Atendimento especial, lúdico e paciente para as crianças se sentirem em casa.',
    category: 'Cabelo',
    popular: false,
    iconName: 'Baby'
  },
  {
    id: 'lavagem',
    name: 'Lavagem',
    price: 10.00,
    durationMin: 10,
    description: 'Shampoo refrescante de menta e massagem capilar relaxante.',
    category: 'Cabelo',
    popular: false,
    iconName: 'Droplet'
  }
];

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    clientPhone: '(11) 98765-4321',
    barberId: 'warley',
    barberName: 'Warley Ferreira',
    serviceId: 'corte-moderno',
    serviceName: 'Corte Degradê + Barba',
    servicePrice: 85.00,
    date: getTodayDateStr(0),
    time: '14:30',
    status: 'pending'
  },
  {
    id: 'apt-2',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    clientPhone: '(11) 98765-4321',
    barberId: 'warley',
    barberName: 'Warley Ferreira',
    serviceId: 'corte-moderno',
    serviceName: 'Corte Fade',
    servicePrice: 50.00,
    date: '2026-06-15',
    time: '14:30',
    status: 'completed',
    paymentMethod: 'PIX'
  },
  {
    id: 'apt-3',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    clientPhone: '(11) 98765-4321',
    barberId: 'kauan',
    barberName: 'Kauan Mendes',
    serviceId: 'corte-moderno',
    serviceName: 'Corte Tesoura',
    servicePrice: 65.00,
    date: '2026-06-02',
    time: '10:00',
    status: 'completed',
    paymentMethod: 'PIX'
  },
  {
    id: 'apt-4',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    clientPhone: '(11) 98765-4321',
    barberId: 'luiz',
    barberName: 'Luiz Gabriel',
    serviceId: 'barba-terapia',
    serviceName: 'Barba Completa',
    servicePrice: 40.00,
    date: '2026-05-20',
    time: '18:00',
    status: 'cancelled'
  },
  {
    id: 'apt-5',
    clientId: 'dhonathan',
    clientName: 'Dhonathan Elias',
    clientPhone: '(67) 99215-4634',
    barberId: 'kauan',
    barberName: 'Kauan Mendes',
    serviceId: 'corte-moderno',
    serviceName: 'Corte Moderno',
    servicePrice: 50.00,
    date: getTodayDateStr(0),
    time: '10:00',
    status: 'completed',
    paymentMethod: 'PIX'
  },
  {
    id: 'apt-6',
    clientId: 'dhonathan',
    clientName: 'Dhonathan Elias',
    clientPhone: '(67) 99215-4634',
    barberId: 'luiz',
    barberName: 'Luiz Gabriel',
    serviceId: 'barba-terapia',
    serviceName: 'Barba Terapia',
    servicePrice: 40.00,
    date: getTodayDateStr(0),
    time: '16:00',
    status: 'pending'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    appointmentId: 'apt-2',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    barberId: 'warley',
    barberName: 'Warley Ferreira',
    stars: 5,
    comment: 'O Warley é sensacional! Atendimento excelente, acabamento perfeito e espaço extremamente confortável.',
    date: '2026-06-15'
  },
  {
    id: 'rev-2',
    appointmentId: 'apt-3',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    barberId: 'kauan',
    barberName: 'Kauan Mendes',
    stars: 4,
    comment: 'Atendimento muito bom do Kauan, corte na tesoura executado com extrema paciência e técnica.',
    date: '2026-06-02'
  },
  {
    id: 'rev-3',
    appointmentId: 'apt-5',
    clientId: 'dhonathan',
    clientName: 'Dhonathan Elias',
    barberId: 'kauan',
    barberName: 'Kauan Mendes',
    stars: 5,
    comment: 'O degradê do Kauan é diferenciado. Trabalho super rápido, limpo e com excelente resultado.',
    date: '2026-07-01'
  },
  {
    id: 'rev-4',
    appointmentId: 'apt-4',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    barberId: 'luiz',
    barberName: 'Luiz Gabriel',
    stars: 5,
    comment: 'A barba-terapia do Luiz é incrível. Uso de óleos essenciais e toalha quente relaxa de verdade.',
    date: '2026-05-20'
  },
  {
    id: 'rev-5',
    appointmentId: 'apt-6',
    clientId: 'dhonathan',
    clientName: 'Dhonathan Elias',
    barberId: 'luiz',
    barberName: 'Luiz Gabriel',
    stars: 5,
    comment: 'Luiz é um ótimo profissional, pontual, educado e com técnica refinada para design de barba.',
    date: '2026-07-10'
  },
  {
    id: 'rev-6',
    appointmentId: 'apt-7',
    clientId: 'ricardo',
    clientName: 'Ricardo Ferreira',
    barberId: 'warley',
    barberName: 'Warley Ferreira',
    stars: 5,
    comment: 'Experiência sempre perfeita. Warley domina as técnicas clássicas e modernas como ninguém.',
    date: '2026-07-12'
  },
  {
    id: 'rev-7',
    appointmentId: 'apt-8',
    clientId: 'dhonathan',
    clientName: 'Dhonathan Elias',
    barberId: 'warley',
    barberName: 'Warley Ferreira',
    stars: 5,
    comment: 'Atendimento diferenciado, excelente papo e corte perfeito. Recomendo fortemente.',
    date: '2026-07-13'
  }
];
