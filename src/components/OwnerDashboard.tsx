import React, { useState, useMemo } from 'react';
import { 
  LogOut, TrendingUp, User as UserIcon, Scissors, Calendar, Plus, Trash2, Edit, 
  DollarSign, Check, Clock, Star, Grid, Users, BarChart3, Tag, Pocket, Info, X, AlertTriangle,
  Upload, Image as ImageIcon, Eye, EyeOff, Receipt, Package, ShoppingBag, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import { User, Service, Appointment, AppointmentStatus, Product, Comanda, ComandaItem, Review } from '../types';

interface OwnerDashboardProps {
  owner: User;
  onLogout: () => void;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  reviews: Review[];
  onUpdateOwner: (updatedOwner: User) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function OwnerDashboard({
  owner,
  onLogout,
  services,
  setServices,
  appointments,
  setAppointments,
  users,
  setUsers,
  reviews,
  onUpdateOwner,
  products,
  setProducts
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'services' | 'professionals' | 'finance' | 'profile' | 'comanda' | 'products'>('dashboard');

  // Comanda state with localStorage persistence
  const [comandas, setComandas] = useState<Comanda[]>(() => {
    try {
      const saved = localStorage.getItem('barbearia_comandas');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'cmd-1',
        code: 'CMD-001',
        clientName: 'Roberto Alves',
        barberId: 'warley',
        barberName: 'Warley',
        items: [
          { id: 'service-1', name: 'Corte de Cabelo', type: 'service', price: 45.00, quantity: 1 },
          { id: 'p-1', name: 'Pomada Modeladora Matte', type: 'product', price: 45.00, quantity: 1 }
        ],
        status: 'open',
        createdAt: new Date().toISOString(),
        totalPrice: 90.00
      },
      {
        id: 'cmd-2',
        code: 'CMD-002',
        clientName: 'Marcos Souza',
        barberId: 'warley',
        barberName: 'Warley Ferreira',
        items: [
          { id: 'service-2', name: 'Barba Premium', type: 'service', price: 35.00, quantity: 1 },
          { id: 'p-2', name: 'Óleo para Barba Premium', type: 'product', price: 35.00, quantity: 1 }
        ],
        status: 'closed',
        paymentMethod: 'PIX',
        createdAt: new Date().toISOString(),
        totalPrice: 70.00
      }
    ];
  });

  // Save comandas to localStorage
  React.useEffect(() => {
    localStorage.setItem('barbearia_comandas', JSON.stringify(comandas));
  }, [comandas]);

  // Product modal and form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');

  // Comanda modal and form states
  const [showComandaModal, setShowComandaModal] = useState(false);
  const [comandaClientName, setComandaClientName] = useState('');
  const [comandaBarberId, setComandaBarberId] = useState('warley');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedComandaForItems, setSelectedComandaForItems] = useState<Comanda | null>(null);
  const [closingComanda, setClosingComanda] = useState<Comanda | null>(null);
  const [comandaPaymentMethod, setComandaPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão'>('PIX');
  
  // Confirmation modals for products
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmComanda, setDeleteConfirmComanda] = useState<{ id: string, code: string } | null>(null);

  // ==========================================
  // APPLE CALENDAR STATE
  // ==========================================
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [calendarFocusDate, setCalendarFocusDate] = useState<Date>(() => new Date());
  const [selectedBarberIdForCalendar, setSelectedBarberIdForCalendar] = useState<string>('all');
  const [calendarViewMode, setCalendarViewMode] = useState<'booked' | 'full'>('booked');
  
  // Create/view appointment modal states
  const [showAddCalendarAptModal, setShowAddCalendarAptModal] = useState(false);
  const [calendarAptClientName, setCalendarAptClientName] = useState('');
  const [calendarAptClientPhone, setCalendarAptClientPhone] = useState('');
  const [calendarAptServiceId, setCalendarAptServiceId] = useState('');
  const [calendarAptBarberId, setCalendarAptBarberId] = useState('');
  const [calendarAptDate, setCalendarAptDate] = useState('');
  const [calendarAptTime, setCalendarAptTime] = useState('10:00');
  const [selectedCalendarApt, setSelectedCalendarApt] = useState<Appointment | null>(null);

  // ==========================================
  // APPLE CALENDAR CONSTANTS & HELPERS
  // ==========================================
  const WEEKDAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

  const getAppointmentPosition = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const startHour = 8;
      const minutesFromStart = (h - startHour) * 60 + (m || 0);
      const top = (minutesFromStart * 80) / 60;
      return top;
    } catch (e) {
      return 0;
    }
  };

  const getAppointmentHeight = (apt: Appointment) => {
    const service = services.find(s => s.id === apt.serviceId);
    const duration = service && typeof service.durationMin === 'number' && service.durationMin > 0 ? service.durationMin : 30;
    const height = (duration * 80) / 60;
    return Math.max(height, 75); // Comfortable minimum height of 75px so all card info fits beautifully
  };

  const currentSunday = new Date(calendarFocusDate);
  const currentSundayDay = currentSunday.getDay();
  currentSunday.setDate(currentSunday.getDate() - currentSundayDay);
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentSunday);
    d.setDate(currentSunday.getDate() + i);
    return d;
  });

  const formatDateToYYYYMMDD = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const focusMonthName = MONTH_NAMES[calendarFocusDate.getMonth()];
  const focusYear = calendarFocusDate.getFullYear();

  const getRedLineTop = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 8 || h >= 22) return null;
    const minutesFromStart = (h - 8) * 60 + m;
    return (minutesFromStart * 80) / 60;
  };
  const redLineTop = getRedLineTop();
  const isSelectedDateToday = selectedDate === formatDateToYYYYMMDD(new Date());
  
  // Owner profile states
  const [ownerName, setOwnerName] = useState(owner.name);
  const [ownerEmail, setOwnerEmail] = useState(owner.email);
  const [ownerPhone, setOwnerPhone] = useState(owner.phone || '');
  const [ownerAvatarUrl, setOwnerAvatarUrl] = useState(owner.avatarUrl || '');
  const [ownerPassword, setOwnerPassword] = useState(owner.password || '');
  const [ownerCommissionPercent, setOwnerCommissionPercent] = useState<number>(owner.commissionPercent !== undefined ? owner.commissionPercent : 50);
  const [ownerSaveSuccess, setOwnerSaveSuccess] = useState(false);
  const [isDraggingOwner, setIsDraggingOwner] = useState(false);
  const [ownerUploadError, setOwnerUploadError] = useState('');

  const handleOwnerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processOwnerImageFile(file);
  };

  const processOwnerImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setOwnerUploadError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    setOwnerUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.src = event.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setOwnerAvatarUrl(compressedBase64);
          } else {
            setOwnerAvatarUrl(event.target?.result as string);
          }
        };
        img.onerror = () => {
          setOwnerUploadError('Erro ao processar imagem.');
        };
      }
    };
    reader.onerror = () => {
      setOwnerUploadError('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleOwnerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOwner(true);
  };

  const handleOwnerDragLeave = () => {
    setIsDraggingOwner(false);
  };

  const handleOwnerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOwner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processOwnerImageFile(file);
    }
  };

  // Service creation/edit modal state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [serviceCategory, setServiceCategory] = useState('Cabelo');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePopular, setServicePopular] = useState(false);

  // Professional modal state
  const [showProfModal, setShowProfModal] = useState(false);
  const [editingProf, setEditingProf] = useState<User | null>(null);
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('Barbeiro');
  const [profPassword, setProfPassword] = useState('');
  const [profCommissionPercent, setProfCommissionPercent] = useState<number>(50);
  const [profServices, setProfServices] = useState<Record<string, { enabled: boolean; customPrice?: number }>>({});

  // Absence Management modal states
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceBarber, setAbsenceBarber] = useState<User | null>(null);
  const [newAbsenceDate, setNewAbsenceDate] = useState('');

  // Security and Password visibility states
  const [showOwnerProfilePassword, setShowOwnerProfilePassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [showOwnerPasswordVerifyModal, setShowOwnerPasswordVerifyModal] = useState(false);
  const [ownerVerifyPasswordInput, setOwnerVerifyPasswordInput] = useState('');
  const [ownerVerifyError, setOwnerVerifyError] = useState('');
  const [onVerifySuccess, setOnVerifySuccess] = useState<(() => void) | null>(null);

  // Complete Appointment helper state
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão'>('PIX');

  // Custom confirmation modals instead of blocked window.confirm
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string, name: string } | null>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<{ id: string, name: string } | null>(null);
  const [selectedBarberForReviews, setSelectedBarberForReviews] = useState<User | null>(null);

  // Calculate calculations
  const completedApts = appointments.filter(a => a.status === 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate revenue from closed comandas
  const closedComandas = comandas.filter(c => c.status === 'closed');
  const todayComandasRevenue = closedComandas
    .filter(c => c.createdAt && c.createdAt.split('T')[0] === todayStr)
    .reduce((sum, c) => sum + c.totalPrice, 0);

  // Calculate today's revenue (including completed appointments and completed comandas)
  const todayRevenue = completedApts
    .filter(a => a.date === todayStr)
    .reduce((sum, current) => sum + (current.totalPrice ?? current.servicePrice), 0) + todayComandasRevenue;

  // Initial target is R$ 1.500,00
  const todayTarget = 1500;
  const progressPercent = Math.min((todayRevenue / todayTarget) * 100, 100);

  // Professionals list
  const professionals = users.filter(u => u.role === 'professional' || u.role === 'owner' || u.id === 'warley');
  const displayedBarbers = professionals.filter(p => selectedBarberIdForCalendar === 'all' || p.id === selectedBarberIdForCalendar);

  // Next appointment simulation
  const nextAppointment = appointments.find(a => a.status === 'pending' || a.status === 'active');

  // Dynamic calculation of the featured professional based on rating and reviews
  const featuredProf = useMemo(() => {
    if (!professionals || professionals.length === 0) return null;
    
    // Sort professionals by rating desc, then ratingCount desc
    const sorted = [...professionals].sort((a, b) => {
      const ratingA = a.rating !== undefined ? a.rating : 5.0;
      const ratingB = b.rating !== undefined ? b.rating : 5.0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      
      const countA = a.ratingCount !== undefined ? a.ratingCount : 0;
      const countB = b.ratingCount !== undefined ? b.ratingCount : 0;
      return countB - countA;
    });
    
    return sorted[0];
  }, [professionals]);

  // Add or update service
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice) return;

    const priceNum = parseFloat(servicePrice);
    if (isNaN(priceNum)) return;

    if (editingService) {
      // Edit mode
      setServices(prev => prev.map(s => s.id === editingService.id ? {
        ...s,
        name: serviceName,
        price: priceNum,
        durationMin: parseInt(serviceDuration) || 30,
        category: serviceCategory,
        description: serviceDescription,
        popular: servicePopular
      } : s));
    } else {
      // Add mode
      const newS: Service = {
        id: 'service-' + Date.now(),
        name: serviceName,
        price: priceNum,
        durationMin: parseInt(serviceDuration) || 30,
        description: serviceDescription,
        category: serviceCategory,
        popular: servicePopular,
        iconName: 'Scissors'
      };
      setServices(prev => [...prev, newS]);
    }

    // Reset Form
    setShowServiceModal(false);
    setEditingService(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('30');
    setServiceDescription('');
    setServicePopular(false);
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServicePrice(service.price.toString());
    setServiceDuration(service.durationMin.toString());
    setServiceCategory(service.category);
    setServiceDescription(service.description);
    setServicePopular(!!service.popular);
    setShowServiceModal(true);
  };

  const handleDeleteService = (id: string, name: string) => {
    setDeleteConfirmService({ id, name });
  };

  const confirmDeleteService = () => {
    if (deleteConfirmService) {
      setServices(prev => prev.filter(s => s.id !== deleteConfirmService.id));
      setDeleteConfirmService(null);
    }
  };

  // Add/Edit Professional
  const handleSaveProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName || !profEmail || !profPassword) return;

    const barberServicesList = Object.entries(profServices).map(([serviceId, config]) => {
      const cfg = config as { enabled: boolean; customPrice?: number };
      return {
        serviceId,
        enabled: cfg.enabled,
        customPrice: cfg.customPrice
      };
    });

    if (editingProf) {
      setUsers(prev => prev.map(u => u.id === editingProf.id ? {
        ...u,
        name: profName,
        email: profEmail,
        phone: profPhone || '(11) 99999-0000',
        specialty: profSpecialty,
        password: profPassword,
        commissionPercent: profCommissionPercent,
        barberServices: barberServicesList
      } : u));
    } else {
      const newP: User = {
        id: 'prof-' + Date.now(),
        name: profName,
        email: profEmail,
        phone: profPhone || '(11) 99999-0000',
        role: 'professional',
        specialty: profSpecialty,
        rating: 5.0,
        ratingCount: 0,
        avatarUrl: '',
        password: profPassword,
        commissionPercent: profCommissionPercent,
        barberServices: barberServicesList,
        absences: []
      };
      setUsers(prev => [...prev, newP]);
    }

    setShowProfModal(false);
    setEditingProf(null);
    setProfName('');
    setProfEmail('');
    setProfPhone('');
    setProfSpecialty('Barbeiro');
    setProfPassword('');
    setProfCommissionPercent(50);
    setProfServices({});
  };

  const handleRevealPassword = (prof: User) => {
    if (revealedPasswords[prof.id]) {
      setRevealedPasswords(prev => ({ ...prev, [prof.id]: false }));
    } else {
      setOwnerVerifyPasswordInput('');
      setOwnerVerifyError('');
      setOnVerifySuccess(() => () => {
        setRevealedPasswords(prev => ({ ...prev, [prof.id]: true }));
      });
      setShowOwnerPasswordVerifyModal(true);
    }
  };

  const handleEditProfClick = (prof: User) => {
    setOwnerVerifyPasswordInput('');
    setOwnerVerifyError('');
    setOnVerifySuccess(() => () => {
      setEditingProf(prof);
      setProfName(prof.name);
      setProfEmail(prof.email);
      setProfPhone(prof.phone || '');
      setProfSpecialty(prof.specialty || 'Barbeiro');
      setProfPassword(prof.password || '');
      setProfCommissionPercent(prof.commissionPercent !== undefined ? prof.commissionPercent : 50);
      
      const initialServices: Record<string, { enabled: boolean; customPrice?: number }> = {};
      services.forEach(s => {
        const config = (prof.barberServices || []).find(x => x.serviceId === s.id);
        initialServices[s.id] = {
          enabled: config ? config.enabled : true,
          customPrice: config && config.customPrice !== undefined ? config.customPrice : s.price
        };
      });
      setProfServices(initialServices);
      
      setShowProfModal(true);
    });
    setShowOwnerPasswordVerifyModal(true);
  };

  const handleVerifyOwnerPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerVerifyPasswordInput === owner.password) {
      if (onVerifySuccess) {
        onVerifySuccess();
      }
      setShowOwnerPasswordVerifyModal(false);
      setOwnerVerifyPasswordInput('');
      setOwnerVerifyError('');
    } else {
      setOwnerVerifyError('Senha administrativa incorreta.');
    }
  };

  // Delete Professional / Barber
  const handleDeleteProf = (id: string, name: string) => {
    setDeleteConfirmUser({ id, name });
  };

  const confirmDeleteProf = () => {
    if (deleteConfirmUser) {
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      setDeleteConfirmUser(null);
    }
  };

  // Quick state modifications for active appointments
  const updateAptStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // Initiate completion modal
  const startCompleteApt = (apt: Appointment) => {
    setCompletingApt(apt);
    setPaymentMethod('PIX');
  };

  // Confirm completion and award loyalty points
  const confirmCompleteApt = () => {
    if (!completingApt) return;

    setAppointments(prev => prev.map(a => a.id === completingApt.id ? { 
      ...a, 
      status: 'completed',
      paymentMethod: paymentMethod
    } : a));

    // Award loyalty points to the customer (10 points per R$ spent)
    setUsers(prev => prev.map(u => {
      if (u.id === completingApt.clientId) {
        const currentPoints = u.points || 0;
        // Award points based on price
        const pointsEarned = Math.round(completingApt.servicePrice * 10);
        return { ...u, points: currentPoints + pointsEarned };
      }
      return u;
    }));

    setCompletingApt(null);
  };

  // ==========================================
  // PRODUCT HANDLERS
  // ==========================================
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice || !productStock) return;

    const priceNum = parseFloat(productPrice);
    const stockNum = parseInt(productStock);
    if (isNaN(priceNum) || isNaN(stockNum)) return;

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: productName,
        price: priceNum,
        stock: stockNum
      } : p));
    } else {
      const newP: Product = {
        id: 'product-' + Date.now(),
        name: productName,
        price: priceNum,
        stock: stockNum
      };
      setProducts(prev => [...prev, newP]);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductName('');
    setProductPrice('');
    setProductStock('');
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductStock(product.stock.toString());
    setShowProductModal(true);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setDeleteConfirmProduct({ id, name });
  };

  const confirmDeleteProduct = () => {
    if (deleteConfirmProduct) {
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmProduct.id));
      setDeleteConfirmProduct(null);
    }
  };

  // ==========================================
  // COMANDA HANDLERS
  // ==========================================
  const handleCreateComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comandaClientName) return;

    // Find barber name
    const selectedBarber = professionals.find(p => p.id === comandaBarberId);
    const barberName = selectedBarber ? selectedBarber.name : 'Não designado';

    // Generate comanda code based on existing comanda length
    const nextCodeNum = comandas.length + 1;
    const codeStr = 'CMD-' + nextCodeNum.toString().padStart(3, '0');

    const newComanda: Comanda = {
      id: 'comanda-' + Date.now(),
      code: codeStr,
      clientName: comandaClientName,
      barberId: comandaBarberId,
      barberName: barberName,
      items: [],
      status: 'open',
      createdAt: new Date().toISOString(),
      totalPrice: 0
    };

    setComandas(prev => [newComanda, ...prev]);
    setShowComandaModal(false);
    setComandaClientName('');
    setComandaBarberId('warley');
  };

  const handleDeleteComanda = (id: string, code: string) => {
    setDeleteConfirmComanda({ id, code });
  };

  const confirmDeleteComanda = () => {
    if (deleteConfirmComanda) {
      // Find the comanda to return product stocks
      const toDelete = comandas.find(c => c.id === deleteConfirmComanda.id);
      if (toDelete && toDelete.status === 'open') {
        // Return products to stock
        const productItems = toDelete.items.filter(item => item.type === 'product');
        if (productItems.length > 0) {
          setProducts(prev => prev.map(p => {
            const item = productItems.find(i => i.id === p.id);
            if (item) {
              return { ...p, stock: p.stock + item.quantity };
            }
            return p;
          }));
        }
      }
      setComandas(prev => prev.filter(c => c.id !== deleteConfirmComanda.id));
      setDeleteConfirmComanda(null);
    }
  };

  // Add Item to Comanda (Services or Products)
  const handleAddItemToComanda = (comandaId: string, item: { id: string; name: string; type: 'service' | 'product'; price: number }) => {
    // If it's a product, verify and deduct stock
    if (item.type === 'product') {
      const prodInDb = products.find(p => p.id === item.id);
      if (!prodInDb || prodInDb.stock <= 0) {
        alert('Este produto está esgotado no estoque!');
        return;
      }
      // Deduct 1 from stock
      setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: p.stock - 1 } : p));
    }

    setComandas(prev => prev.map(c => {
      if (c.id === comandaId) {
        // Check if item already exists
        const existingItemIndex = c.items.findIndex(i => i.id === item.id && i.type === item.type);
        let updatedItems = [...c.items];

        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + 1
          };
        } else {
          updatedItems.push({
            id: item.id,
            name: item.name,
            type: item.type,
            price: item.price,
            quantity: 1
          });
        }

        const newTotalPrice = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        return {
          ...c,
          items: updatedItems,
          totalPrice: newTotalPrice
        };
      }
      return c;
    }));
  };

  // Remove Item from Comanda
  const handleRemoveItemFromComanda = (comandaId: string, itemId: string, itemType: 'service' | 'product') => {
    setComandas(prev => prev.map(c => {
      if (c.id === comandaId) {
        const itemToRemove = c.items.find(i => i.id === itemId && i.type === itemType);
        if (!itemToRemove) return c;

        // Return stock if it is a product
        if (itemType === 'product') {
          setProducts(prevProducts => prevProducts.map(p => p.id === itemId ? { ...p, stock: p.stock + 1 } : p));
        }

        let updatedItems = [...c.items];
        const existingIndex = updatedItems.findIndex(i => i.id === itemId && i.type === itemType);

        if (existingIndex > -1) {
          if (updatedItems[existingIndex].quantity > 1) {
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity - 1
            };
          } else {
            updatedItems = updatedItems.filter(i => !(i.id === itemId && i.type === itemType));
          }
        }

        const newTotalPrice = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        return {
          ...c,
          items: updatedItems,
          totalPrice: newTotalPrice
        };
      }
      return c;
    }));
  };

  // Close / Finalize Comanda
  const handleCloseComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingComanda) return;

    setComandas(prev => prev.map(c => c.id === closingComanda.id ? {
      ...c,
      status: 'closed',
      paymentMethod: comandaPaymentMethod,
      closedAt: new Date().toISOString()
    } : c));

    setClosingComanda(null);
  };

  // ==========================================
  // APPLE CALENDAR HANDLERS
  // ==========================================
  const handlePrevWeek = () => {
    setCalendarFocusDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() - 7);
      return nextDate;
    });
  };

  const handleNextWeek = () => {
    setCalendarFocusDate(prev => {
      const nextDate = new Date(prev);
      nextDate.setDate(prev.getDate() + 7);
      return nextDate;
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCalendarFocusDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const hasAppointmentsOnDate = (dateStr: string) => {
    return appointments.some(a => a.date === dateStr && a.status !== 'cancelled');
  };

  const handleCellClick = (barberId: string, hourStr: string) => {
    setCalendarAptBarberId(barberId);
    setCalendarAptDate(selectedDate);
    setCalendarAptTime(hourStr);
    setCalendarAptClientName('');
    setCalendarAptClientPhone('');
    if (services.length > 0) {
      setCalendarAptServiceId(services[0].id);
    } else {
      setCalendarAptServiceId('');
    }
    setSelectedCalendarApt(null);
    setShowAddCalendarAptModal(true);
  };

  const handleCreateCalendarAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarAptClientName || !calendarAptServiceId || !calendarAptBarberId || !calendarAptDate || !calendarAptTime) return;

    const selectedService = services.find(s => s.id === calendarAptServiceId);
    const selectedBarber = professionals.find(p => p.id === calendarAptBarberId);
    if (!selectedService || !selectedBarber) return;

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      clientId: 'manual-client-' + Date.now(),
      clientName: calendarAptClientName,
      clientPhone: calendarAptClientPhone || '(00) 00000-0000',
      barberId: calendarAptBarberId,
      barberName: selectedBarber.name,
      serviceId: calendarAptServiceId,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      date: calendarAptDate,
      time: calendarAptTime,
      status: 'pending'
    };

    setAppointments(prev => [...prev, newApt]);
    setShowAddCalendarAptModal(false);
    
    setCalendarAptClientName('');
    setCalendarAptClientPhone('');
  };

  const handleDeleteCalendarApt = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    setShowAddCalendarAptModal(false);
    setSelectedCalendarApt(null);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-[#e5e2e1] overflow-x-hidden">
      
      {/* Sidebar - Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Panel */}
          <aside className="relative flex flex-col w-80 max-w-[85vw] bg-[#121212] border-r border-neutral-800 h-full shrink-0 select-none shadow-2xl animate-slide-in-left overflow-y-auto">
            {/* Header / Logo */}
            <div className="p-6 flex items-center justify-between border-b border-neutral-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-2xl">
                  <Scissors className="h-5 w-5 text-[#eab308]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-tight leading-none">Barbearia do Warley</h2>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1">Gestão Profissional</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="mt-6 px-3 flex-1 space-y-1">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Grid className="h-4 w-4" />
                Painel Geral
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Agenda Integrada
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('finance');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'finance'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dados Financeiros
              </button>

              <button
                onClick={() => {
                  setActiveTab('comanda');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'comanda'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Receipt className="h-4 w-4" />
                Comandas
              </button>

              <button
                onClick={() => {
                  setActiveTab('products');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Package className="h-4 w-4" />
                Catálogo de Produtos
              </button>

              <button
                onClick={() => {
                  setActiveTab('services');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Tag className="h-4 w-4" />
                Catálogo de Serviços
              </button>

              <button
                onClick={() => {
                  setActiveTab('professionals');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'professionals'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                Equipe / Barbeiros
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                    : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Meu Perfil
              </button>
            </nav>

            {/* Bottom section */}
            <div className="p-4 border-t border-neutral-800">
              <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-neutral-900 rounded-xl">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  <img src={owner.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{owner.name}</p>
                  <p className="text-[10px] text-yellow-500 font-semibold uppercase">Proprietário</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sair do Painel
              </button>
            </div>
          </aside>
        </div>
      )}
      
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-72 bg-[#121212] border-r border-neutral-800 shrink-0 select-none">
        <div className="p-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-black rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-2xl">
            <Scissors className="h-5.5 w-5.5 text-[#eab308]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-none">Barbearia do Warley</h2>
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 mt-1">Gestão Profissional</p>
          </div>
        </div>

        <nav className="mt-8 px-3 flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Grid className="h-4 w-4" />
            Painel Geral
          </button>
          
          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Agenda Integrada
          </button>
          
          <button
            onClick={() => setActiveTab('finance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'finance'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dados Financeiros
          </button>

          <button
            onClick={() => setActiveTab('comanda')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'comanda'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Comandas
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            Catálogo de Produtos
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'services'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
            Catálogo de Serviços
          </button>

          <button
            onClick={() => setActiveTab('professionals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'professionals'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            Equipe / Barbeiros
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#eab308]/10 text-[#eab308] border-l-4 border-[#eab308] pl-3'
                : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Meu Perfil
          </button>
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-neutral-900 rounded-xl">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              <img src={owner.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{owner.name}</p>
              <p className="text-[10px] text-yellow-500 font-semibold uppercase">Proprietário</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header className="h-16 bg-[#0e0e0e] border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-all cursor-pointer mr-1"
              title="Menu Lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden md:block w-2.5 h-2.5 rounded-full bg-[#eab308] animate-pulse"></span>
            <h1 className="text-sm font-extrabold tracking-widest text-[#eab308] uppercase font-mono">
              Gestão Inteligente
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{owner.name}</p>
              <p className="text-[10px] text-yellow-400 font-semibold uppercase">Master Barber • Dono</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden ring-2 ring-[#eab308]/30">
              <img src={owner.avatarUrl} alt="Warley Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={onLogout}
              className="md:hidden p-2 text-neutral-400 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 p-6 space-y-6 max-w-6xl w-full mx-auto pb-24 md:pb-8">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Welcome text */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Bem-vindo, Warley!</h2>
                  <p className="text-neutral-400 text-xs mt-1">Veja os indicadores e andamento dos serviços hoje.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('finance')}
                    className="px-4 py-2 bg-[#161616] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-neutral-800 cursor-pointer"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Ver Financeiro
                  </button>
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setShowServiceModal(true);
                    }}
                    className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#eab308]/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Novo Serviço
                  </button>
                </div>
              </div>

              {/* Grid 1: Main Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Appointment Primary Card */}
                <div className="lg:col-span-8 bg-[#161616] border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Calendar className="text-[#eab308] h-40 w-40" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#eab308]/15 text-[#eab308] text-[10px] font-black rounded uppercase tracking-wider">
                        {nextAppointment ? 'Próximo Cliente' : 'Sem agendamentos pendentes'}
                      </span>
                      {nextAppointment && (
                        <span className="text-[#eab308] font-mono text-xs font-bold bg-[#1a1a1a] px-2 py-0.5 rounded-lg border border-[#eab308]/20">
                          {nextAppointment.time} - Hoje
                        </span>
                      )}
                    </div>

                    {nextAppointment ? (
                      <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white tracking-tight">{nextAppointment.serviceName}</h3>
                          <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
                            <UserIcon className="h-3.5 w-3.5" />
                            Cliente: {nextAppointment.clientName} | Barbeiro: {nextAppointment.barberName}
                          </p>
                          <p className="text-xs font-bold text-[#eab308] mt-1 font-mono">
                            Valor: R$ {nextAppointment.servicePrice.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {nextAppointment.status === 'pending' ? (
                            <button
                              onClick={() => updateAptStatus(nextAppointment.id, 'active')}
                              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg border border-neutral-700 cursor-pointer"
                            >
                              Iniciar Atendimento
                            </button>
                          ) : (
                            <button
                              onClick={() => startCompleteApt(nextAppointment)}
                              className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Finalizar e Receber
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-xs text-neutral-400">Todos os clientes de hoje foram atendidos ou não há agendamentos agendados.</p>
                      </div>
                    )}

                    <div className="w-full h-44 rounded-xl overflow-hidden relative border border-neutral-800 mt-2">
                      <img
                        className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwtCWKNLIK_u2P5-naL0LA1CAvmpK46ibnXcXmdT6DXbmbUNNrGXEHehoT92yOy-_APPwQtM9AH3ivWPcWw_hXSvU0PCQYB9M28Xh0sXWOwSQL82hCSwKAs9_X3N1FMWIMOGsTTlfKs_znWA0d6PejuZMQMlu5hzyi0G_YGTNESq3vkN99wvGPEs3-0fTjBR8qGRyc7MFlc0I9XQfhNJ_nOqRV6ymonhHCo6Pt-wJlXaq7U-ezXwz03YexCd-nHgRHIIuzbmfBex52"
                        alt="Precision haircut"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent"></div>
                    </div>
                  </div>
                </div>

                {/* Financial Progress Widget (EXCLUSIVE OWNER) */}
                <div className="lg:col-span-4 bg-[#161616] border border-[#eab308]/20 rounded-2xl p-5 flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute -bottom-8 -right-8 opacity-[0.02] text-white">
                    <DollarSign className="w-32 h-32" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-[#eab308]/10 text-[#eab308] rounded-xl border border-[#eab308]/20">
                        <Pocket className="h-5 w-5" />
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-950/50 border border-yellow-500/20 text-[#eab308] text-[10px] font-bold">
                          Faturamento
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Receita de Hoje</p>
                      <h3 className="text-3xl font-black text-white mt-1 font-mono">
                        R$ {todayRevenue.toFixed(2)}
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Meta diária: <span className="text-white font-mono font-bold">R$ {todayTarget.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-1.5">
                    <div className="w-full bg-[#222] h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#eab308] h-full shadow-[0_0_8px_rgba(0,200,83,0.6)] transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold font-mono">
                      <span className="text-[#eab308]">{progressPercent.toFixed(0)}% Alcançado</span>
                      <span className="text-neutral-400">Meta R$ 1.500</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Grid 2: Recent and Staff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Barber Highlight */}
                <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Profissional em Destaque</h3>
                  
                  {featuredProf ? (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-[#222]/50 border border-neutral-800/80 hover:border-[#eab308]/30 transition-all">
                      <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#eab308]/30 shrink-0 bg-[#222] flex items-center justify-center text-white font-extrabold text-sm">
                        {featuredProf.avatarUrl ? (
                          <img 
                            src={featuredProf.avatarUrl} 
                            alt={featuredProf.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          featuredProf.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-sm">{featuredProf.name}</p>
                        <p className="text-xs text-[#eab308] font-semibold">{featuredProf.specialty || 'Barbeiro Premium'}</p>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-neutral-400">
                          <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308] shrink-0" />
                          <span className="text-[#eab308] font-bold">{featuredProf.rating !== undefined ? featuredProf.rating.toFixed(1) : '5.0'}</span>
                          <span>({featuredProf.ratingCount || 0} {featuredProf.ratingCount === 1 ? 'avaliação' : 'avaliações'})</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-xl bg-neutral-900 border border-neutral-800/60 text-xs text-neutral-500">
                      Nenhum profissional cadastrado.
                    </div>
                  )}
                </div>

                {/* Recent services */}
                <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Serviços Recentes</h3>
                    <button onClick={() => setActiveTab('finance')} className="text-xs text-[#eab308] hover:underline cursor-pointer">
                      Ver histórico
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {completedApts.slice(0, 3).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#222]/20 hover:bg-[#222]/50 transition-colors text-xs border border-neutral-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[#eab308]">
                            <Scissors className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{apt.serviceName}</p>
                            <p className="text-[10px] text-neutral-400">Atendido por {apt.barberName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-[#eab308]">R$ {(apt.totalPrice ?? apt.servicePrice).toFixed(2)}</p>
                          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Pago via {apt.paymentMethod || 'PIX'}</p>
                        </div>
                      </div>
                    ))}
                    {completedApts.length === 0 && (
                      <p className="text-xs text-neutral-400 text-center py-4">Nenhum serviço finalizado hoje ainda.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-fade-in">

              {/* APPLE CALENDAR-STYLE SCHEDULER */}
              <div id="apple-calendar-section" className="bg-[#121212] border border-neutral-800 rounded-3xl p-6 space-y-6 font-sans">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#eab308]/10 text-[#eab308] rounded-2xl border border-[#eab308]/15">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                        Agenda Integrada
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {focusMonthName} de {focusYear} • Controle diário de atendimentos
                      </p>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleGoToToday}
                      className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-[#eab308]/30 hover:bg-neutral-850 text-neutral-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Hoje
                    </button>
                    
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                      <button
                        onClick={handlePrevWeek}
                        className="p-2.5 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Semana Anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="w-px h-4 bg-neutral-800"></span>
                      <button
                        onClick={handleNextWeek}
                        className="p-2.5 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Próxima Semana"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setCalendarAptBarberId(selectedBarberIdForCalendar !== 'all' ? selectedBarberIdForCalendar : (professionals[0]?.id || ''));
                        setCalendarAptDate(selectedDate);
                        setCalendarAptTime('10:00');
                        setCalendarAptClientName('');
                        setCalendarAptClientPhone('');
                        if (services.length > 0) setCalendarAptServiceId(services[0].id);
                        setSelectedCalendarApt(null);
                        setShowAddCalendarAptModal(true);
                      }}
                      className="px-3.5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#eab308]/10"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span className="hidden xs:inline">Agendar</span>
                    </button>
                  </div>
                </div>

                {/* Weekly Strip */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center bg-neutral-950/40 p-1.5 md:p-3 rounded-2xl border border-neutral-850">
                  {weekDays.map((dateObj, idx) => {
                    const dStr = formatDateToYYYYMMDD(dateObj);
                    const isSelected = selectedDate === dStr;
                    const isToday = formatDateToYYYYMMDD(new Date()) === dStr;
                    const hasApts = hasAppointmentsOnDate(dStr);
                    const dayNum = dateObj.getDate();
                    const weekdayName = WEEKDAY_NAMES[dateObj.getDay()];

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(dStr)}
                        className={`py-2 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center relative group ${
                          isSelected
                            ? 'bg-[#eab308] text-black shadow-lg shadow-[#eab308]/20 font-black'
                            : 'hover:bg-neutral-800/40 text-neutral-300'
                        }`}
                      >
                        <span className={`text-[8px] md:text-[9px] font-bold tracking-wider uppercase mb-1 ${
                          isSelected ? 'text-black/80' : 'text-neutral-500'
                        }`}>
                          {weekdayName}
                        </span>
                        
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-black transition-all ${
                          isSelected 
                            ? 'bg-black/10 text-black' 
                            : isToday 
                              ? 'border border-[#eab308] text-[#eab308] font-black' 
                              : ''
                        }`}>
                          {dayNum}
                        </div>

                        {/* Appointment dot indicator */}
                        {hasApts && (
                          <div className={`w-1 h-1 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${
                            isSelected ? 'bg-black' : 'bg-[#eab308]'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Professional Selection Tabs */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider pl-1">Filtrar por Barbeiro:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedBarberIdForCalendar('all')}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBarberIdForCalendar === 'all'
                          ? 'bg-[#eab308] text-black shadow-lg shadow-[#eab308]/15 scale-[1.01]'
                          : 'bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>Todos os Barbeiros</span>
                    </button>
                    {professionals.map((barber) => {
                      const isSelected = selectedBarberIdForCalendar === barber.id;
                      const barberAptsCount = appointments.filter(a => a.date === selectedDate && a.barberId === barber.id && a.status !== 'cancelled').length;
                      
                      return (
                        <button
                          key={barber.id}
                          onClick={() => setSelectedBarberIdForCalendar(barber.id)}
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#eab308] text-black shadow-lg shadow-[#eab308]/15 scale-[1.01]'
                              : 'bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850'
                          }`}
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                            <img 
                              src={barber.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} 
                              alt={barber.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span>{barber.name}</span>
                          {barberAptsCount > 0 && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                              isSelected ? 'bg-black/10 text-black' : 'bg-[#eab308]/10 text-[#eab308]'
                            }`}>
                              {barberAptsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* View Mode Toggle (only visible when viewing 'all' barbers) */}
                {selectedBarberIdForCalendar === 'all' && (
                  <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4 flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider pl-1">Exibição:</span>
                    <div className="flex bg-neutral-900 border border-neutral-850 p-1 rounded-xl">
                      <button
                        onClick={() => setCalendarViewMode('booked')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calendarViewMode === 'booked'
                            ? 'bg-[#eab308] text-black font-extrabold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Apenas Agendados
                      </button>
                      <button
                        onClick={() => setCalendarViewMode('full')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          calendarViewMode === 'full'
                            ? 'bg-[#eab308] text-black font-extrabold shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Grade Completa
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Schedule Content (Fully Responsive, No nested scrollbars) */}
                <div className="mt-4">
                  {selectedBarberIdForCalendar === 'all' && calendarViewMode === 'booked' ? (
                    /* Layout A: Chronological Booked Appointments */
                    (() => {
                      const dailyBookedApts = appointments
                        .filter(a => a.date === selectedDate && a.status !== 'cancelled')
                        .sort((a, b) => a.time.localeCompare(b.time));

                      if (dailyBookedApts.length === 0) {
                        return (
                          <div className="bg-[#141414] border border-neutral-850 rounded-2xl p-8 text-center space-y-4">
                            <div className="w-14 h-14 bg-[#eab308]/5 text-[#eab308]/60 rounded-full flex items-center justify-center mx-auto border border-[#eab308]/10">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white">Nenhum atendimento agendado</h4>
                              <p className="text-xs text-neutral-400 max-w-xs mx-auto">Não há horários reservados para esta data de hoje.</p>
                            </div>
                            <button
                              onClick={() => {
                                setCalendarAptBarberId(professionals[0]?.id || '');
                                setCalendarAptDate(selectedDate);
                                setCalendarAptTime('10:00');
                                setCalendarAptClientName('');
                                setCalendarAptClientPhone('');
                                if (services.length > 0) setCalendarAptServiceId(services[0].id);
                                setSelectedCalendarApt(null);
                                setShowAddCalendarAptModal(true);
                              }}
                              className="px-4 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-[#eab308]/10 active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5 stroke-[3]" />
                              Novo Agendamento
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                              {dailyBookedApts.length} {dailyBookedApts.length === 1 ? 'Atendimento' : 'Atendimentos'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {dailyBookedApts.map((apt) => {
                              const barber = professionals.find(p => p.id === apt.barberId);
                              
                              let statusColor = 'border-l-4 border-l-[#eab308] bg-yellow-950/10 text-yellow-200 border-[#eab308]/15 hover:bg-yellow-950/15';
                              let statusText = 'AGENDADO';
                              if (apt.status === 'completed') {
                                statusColor = 'border-l-4 border-l-emerald-500 bg-emerald-950/10 text-emerald-200 border-emerald-500/15 hover:bg-emerald-950/15';
                                statusText = 'PAGO / CONCLUÍDO';
                              } else if (apt.status === 'active') {
                                statusColor = 'border-l-4 border-l-sky-500 bg-sky-950/10 text-sky-200 border-sky-500/15 hover:bg-sky-950/15';
                                statusText = 'ATENDENDO';
                              }

                              return (
                                <div
                                  key={apt.id}
                                  onClick={() => {
                                    setSelectedCalendarApt(apt);
                                    setCalendarAptClientName(apt.clientName);
                                    setCalendarAptClientPhone(apt.clientPhone);
                                    setCalendarAptServiceId(apt.serviceId);
                                    setCalendarAptBarberId(apt.barberId);
                                    setCalendarAptDate(apt.date);
                                    setCalendarAptTime(apt.time);
                                    setShowAddCalendarAptModal(true);
                                  }}
                                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col xs:flex-row xs:items-center justify-between gap-4 shadow-sm ${statusColor}`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="bg-neutral-950/60 border border-neutral-800 px-3 py-2 rounded-xl text-center shrink-0 min-w-[65px]">
                                      <span className="text-base font-black tracking-tight font-mono text-white">{apt.time}</span>
                                    </div>

                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 bg-white/5 rounded text-neutral-300">
                                          {statusText}
                                        </span>
                                        <span className="text-neutral-400 text-[11px] font-mono font-bold">
                                          R$ {(apt.totalPrice ?? apt.servicePrice).toFixed(2)}
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-black text-white truncate">
                                        {apt.serviceName}
                                      </h4>
                                      <div className="text-[11px] text-neutral-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span>Cli: <strong className="text-white font-extrabold">{apt.clientName}</strong></span>
                                        <span className="text-neutral-600">•</span>
                                        <span className="flex items-center gap-1 text-neutral-400">
                                          <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                                            <img src={barber?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt={apt.barberName} className="w-full h-full object-cover" />
                                          </div>
                                          <span className="truncate">{apt.barberName}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between xs:justify-end border-t border-white/5 xs:border-none pt-2 xs:pt-0 shrink-0">
                                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1 xs:hidden">
                                      <Info className="h-3 w-3 text-[#eab308]" /> Toque para Gerenciar
                                    </span>
                                    <div className="hidden xs:flex items-center gap-0.5 text-xs font-black text-[#eab308] bg-black/10 hover:bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                                      <span>Gerenciar</span>
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : selectedBarberIdForCalendar !== 'all' ? (
                    /* Layout B: Hourly Timeline for a Specific Barber */
                    <div className="space-y-2">
                      {HOURS.map((hour) => {
                        const barber = professionals.find(p => p.id === selectedBarberIdForCalendar);
                        const apt = appointments.find(
                          a => a.date === selectedDate && 
                          a.barberId === selectedBarberIdForCalendar && 
                          a.time === hour && 
                          a.status !== 'cancelled'
                        );

                        if (apt) {
                          let statusColor = 'border-l-4 border-l-[#eab308] bg-yellow-950/10 text-yellow-200 border-[#eab308]/15 hover:bg-yellow-950/15';
                          let statusText = 'AGENDADO';
                          if (apt.status === 'completed') {
                            statusColor = 'border-l-4 border-l-emerald-500 bg-emerald-950/10 text-emerald-200 border-emerald-500/15 hover:bg-emerald-950/15';
                            statusText = 'PAGO / CONCLUÍDO';
                          } else if (apt.status === 'active') {
                            statusColor = 'border-l-4 border-l-sky-500 bg-sky-950/10 text-sky-200 border-sky-500/15 hover:bg-sky-950/15';
                            statusText = 'ATENDENDO';
                          }

                          return (
                            <div
                              key={apt.id}
                              onClick={() => {
                                setSelectedCalendarApt(apt);
                                setCalendarAptClientName(apt.clientName);
                                setCalendarAptClientPhone(apt.clientPhone);
                                setCalendarAptServiceId(apt.serviceId);
                                setCalendarAptBarberId(apt.barberId);
                                setCalendarAptDate(apt.date);
                                setCalendarAptTime(apt.time);
                                setShowAddCalendarAptModal(true);
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col xs:flex-row xs:items-center justify-between gap-4 shadow-sm ${statusColor}`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="bg-neutral-950/60 border border-neutral-850 px-3.5 py-2.5 rounded-xl text-center shrink-0 min-w-[65px] font-mono font-bold text-sm text-white">
                                  {hour}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 bg-white/5 rounded text-neutral-300">
                                      {statusText}
                                    </span>
                                    <span className="text-neutral-400 text-[11px] font-mono font-bold">
                                      R$ {(apt.totalPrice ?? apt.servicePrice).toFixed(2)}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-black text-white truncate">{apt.serviceName}</h4>
                                  <p className="text-[11px] text-neutral-300 leading-none">
                                    Cli: <strong className="text-white font-extrabold">{apt.clientName}</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between xs:justify-end border-t border-white/5 xs:border-none pt-2 xs:pt-0 shrink-0">
                                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1 xs:hidden">
                                  <Info className="h-3 w-3 text-[#eab308]" /> Toque para Gerenciar
                                </span>
                                <div className="hidden xs:flex items-center gap-0.5 text-xs font-black text-[#eab308] bg-black/10 hover:bg-black/30 px-2.5 py-1 rounded-lg border border-white/5">
                                  <span>Gerenciar</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={hour}
                            onClick={() => handleCellClick(selectedBarberIdForCalendar, hour)}
                            className="p-3.5 rounded-xl border border-dashed border-neutral-850 bg-neutral-900/10 hover:bg-[#eab308]/5 hover:border-[#eab308]/25 transition-all cursor-pointer flex items-center justify-between gap-3 group/slot select-none"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="bg-neutral-900/60 border border-neutral-850/80 w-14 py-2 rounded-lg text-center font-mono font-bold text-neutral-400 group-hover/slot:text-[#eab308] group-hover/slot:border-[#eab308]/20 transition-all text-xs shrink-0">
                                {hour}
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-neutral-500 uppercase tracking-widest group-hover/slot:text-[#eab308]/80 transition-all leading-none">Horário Livre</h5>
                                <p className="text-[10px] text-neutral-600 font-bold tracking-wider mt-1 leading-none">Sem agendamento • Toque para reservar</p>
                              </div>
                            </div>
                            
                            <div className="w-7 h-7 rounded-full bg-neutral-900/60 border border-neutral-850/85 flex items-center justify-center text-neutral-500 group-hover/slot:bg-[#eab308]/20 group-hover/slot:text-[#eab308] group-hover/slot:border-[#eab308]/30 transition-all shadow-inner">
                              <Plus className="h-3.5 w-3.5 stroke-[3]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Layout C: Complete Hourly Timeline for All Barbers */
                    <div className="space-y-5">
                      {HOURS.map((hour) => {
                        return (
                          <div key={hour} className="border-b border-neutral-900 pb-4 last:border-none last:pb-0 space-y-2">
                            {/* Hour Header */}
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-white font-mono tracking-wider bg-neutral-900 border border-neutral-850 px-3 py-1 rounded-lg">
                                {hour}
                              </span>
                              <div className="flex-1 h-px bg-neutral-800/30"></div>
                            </div>

                            {/* Barbers grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-1">
                              {professionals.map((barber) => {
                                const apt = appointments.find(
                                  a => a.date === selectedDate && 
                                  a.barberId === barber.id && 
                                  a.time === hour && 
                                  a.status !== 'cancelled'
                                );

                                if (apt) {
                                  let statusStyles = 'border-l-3 border-l-[#eab308] bg-yellow-950/10 text-yellow-200 border-[#eab308]/15 hover:bg-yellow-950/15';
                                  if (apt.status === 'completed') {
                                    statusStyles = 'border-l-3 border-l-emerald-500 bg-emerald-950/10 text-emerald-200 border-emerald-500/15 hover:bg-emerald-950/15';
                                  } else if (apt.status === 'active') {
                                    statusStyles = 'border-l-3 border-l-sky-500 bg-sky-950/10 text-sky-200 border-sky-500/15 hover:bg-sky-950/15';
                                  }

                                  return (
                                    <div
                                      key={barber.id}
                                      onClick={() => {
                                        setSelectedCalendarApt(apt);
                                        setCalendarAptClientName(apt.clientName);
                                        setCalendarAptClientPhone(apt.clientPhone);
                                        setCalendarAptServiceId(apt.serviceId);
                                        setCalendarAptBarberId(apt.barberId);
                                        setCalendarAptDate(apt.date);
                                        setCalendarAptTime(apt.time);
                                        setShowAddCalendarAptModal(true);
                                      }}
                                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${statusStyles}`}
                                    >
                                      <div className="min-w-0 flex items-center gap-2.5">
                                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/5 bg-neutral-800">
                                          <img src={barber.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt={barber.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-black uppercase text-neutral-400 truncate tracking-wide leading-none">{barber.name}</p>
                                          <p className="text-xs font-bold text-white truncate mt-1 leading-none">{apt.serviceName}</p>
                                          <p className="text-[10px] text-neutral-300 truncate mt-0.5 leading-none">Cli: <strong className="text-white font-extrabold">{apt.clientName}</strong></p>
                                        </div>
                                      </div>
                                      <ChevronRight className="h-4 w-4 opacity-50 shrink-0 text-[#eab308]" />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      key={barber.id}
                                      onClick={() => handleCellClick(barber.id, hour)}
                                      className="p-3 rounded-xl border border-neutral-900 bg-neutral-950/10 hover:bg-[#eab308]/5 hover:border-[#eab308]/25 transition-all cursor-pointer flex items-center justify-between gap-3 group/slot select-none"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900 opacity-50">
                                          <img src={barber.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt={barber.name} className="w-full h-full object-cover grayscale" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-[9px] font-black uppercase text-neutral-500 truncate tracking-wide leading-none">{barber.name}</p>
                                          <p className="text-xs font-bold text-neutral-500 group-hover/slot:text-[#eab308]/85 transition-all mt-1 leading-none">Disponível</p>
                                        </div>
                                      </div>
                                      <Plus className="h-3.5 w-3.5 text-neutral-600 group-hover/slot:text-[#eab308] transition-colors shrink-0 stroke-[3]" />
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Legend / Tips */}
                <div className="flex flex-wrap gap-3 text-[10px] text-neutral-400 justify-center bg-neutral-900/10 py-3 px-4 rounded-xl border border-neutral-850/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                    <span>Agendado / Pendente</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Em Atendimento</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Finalizado / Recebido</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span className="w-2 h-2 rounded border border-dashed border-neutral-700"></span>
                    <span>Toque para agendar rápido</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Finance Tab (EXCLUSIVE OWNER) */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Estatísticas &amp; Faturamento</h2>
                  <p className="text-xs text-neutral-400 mt-1">Dados confidenciais de faturamento bruto e métodos de recebimento.</p>
                </div>
              </div>

              {/* Finance cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
                  <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Faturamento Total Geral</p>
                  <h3 className="text-3xl font-black text-[#eab308] mt-2 font-mono">
                    R$ {appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.totalPrice ?? a.servicePrice), 0).toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Somatório de todas as vendas cadastradas</p>
                </div>

                <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
                  <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Ticket Médio</p>
                  <h3 className="text-3xl font-black text-white mt-2 font-mono">
                    R$ {(appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.totalPrice ?? a.servicePrice), 0) / (appointments.filter(a => a.status === 'completed').length || 1)).toFixed(2)}
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Média gasta por cliente atendido</p>
                </div>

                <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
                  <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Serviços Executados</p>
                  <h3 className="text-3xl font-black text-white mt-2 font-mono">
                    {appointments.filter(a => a.status === 'completed').length} cortes
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Total de atendimentos finalizados com sucesso</p>
                </div>
              </div>

              {/* Graphical Representation using Pure Styled Grid Blocks (Fidelity!) */}
              <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Faturamento Estimado por Barbeiro</h3>
                
                <div className="space-y-4 pt-2">
                  {professionals.map(p => {
                    // Calculate revenue generated by this professional
                    const revenue = appointments
                      .filter(a => a.status === 'completed' && a.barberId === p.id)
                      .reduce((sum, current) => sum + (current.totalPrice ?? current.servicePrice), 0);

                    // Percent relative to today target or arbitrary scale
                    const widthPercent = Math.min((revenue / 800) * 100, 100);
                    
                    const commissionRate = p.commissionPercent !== undefined ? p.commissionPercent : 50;
                    const commissionAmount = revenue * (commissionRate / 100);

                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <span className="font-bold text-white">{p.name} ({p.specialty})</span>
                            <span className="text-[10px] text-neutral-500 block">Comissão ({commissionRate}%): R$ {commissionAmount.toFixed(2)}</span>
                          </div>
                          <span className="font-mono text-[#eab308] font-bold">R$ {revenue.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-[#222] h-3 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#eab308] h-full shadow-[0_0_6px_rgba(0,200,83,0.3)] transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Histórico Geral de Entradas</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                        <th className="py-2.5">Cliente</th>
                        <th>Serviço</th>
                        <th>Barbeiro</th>
                        <th>Método</th>
                        <th className="text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {completedApts.map(apt => (
                        <tr key={apt.id} className="hover:bg-neutral-900/30">
                          <td className="py-3 font-semibold text-white">{apt.clientName}</td>
                          <td>{apt.serviceName}</td>
                          <td>{apt.barberName}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded bg-yellow-950/40 text-yellow-400 font-bold text-[10px] tracking-wider uppercase">
                              {apt.paymentMethod || 'PIX'}
                            </span>
                          </td>
                          <td className="text-right font-mono font-bold text-[#eab308]">
                            R$ {(apt.totalPrice ?? apt.servicePrice).toFixed(2)}
                            {apt.products && apt.products.length > 0 && (
                              <span className="block text-[8px] text-neutral-400 font-sans tracking-normal mt-0.5" title={apt.products.map(p => `${p.quantity}x ${p.name}`).join(', ')}>
                                + {apt.products.reduce((acc, curr) => acc + curr.quantity, 0)} prod.
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {completedApts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-neutral-500">Nenhum recebimento registrado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Comanda Tab */}
          {activeTab === 'comanda' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Comandas de Consumo</h2>
                  <p className="text-xs text-neutral-400 mt-1">Gerencie consumos, adicione serviços/produtos e finalize comandas diretamente.</p>
                </div>
                <button
                  onClick={() => {
                    setComandaClientName('');
                    setComandaBarberId(professionals[0]?.id || 'warley');
                    setShowComandaModal(true);
                  }}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Abrir Nova Comanda
                </button>
              </div>

              {/* Grid: Open Comandas on Left, History on Right or stacked */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Active Open Comandas */}
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <h3 className="text-sm uppercase tracking-wider text-neutral-400 font-extrabold flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Comandas Abertas ({comandas.filter(c => c.status === 'open').length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comandas.filter(c => c.status === 'open').map((comanda) => (
                      <div key={comanda.id} className="bg-[#121212] border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded">
                                {comanda.code}
                              </span>
                              <h4 className="text-sm font-black text-white tracking-tight mt-1 truncate max-w-[150px]">{comanda.clientName}</h4>
                              <p className="text-[10px] text-neutral-500">Atendido por: <strong className="text-neutral-400">{comanda.barberName}</strong></p>
                            </div>
                            <button
                              onClick={() => handleDeleteComanda(comanda.id, comanda.code)}
                              className="text-neutral-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Cancelar Comanda"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Items in Comanda */}
                          <div className="border-t border-b border-neutral-900 py-2.5 space-y-1.5 max-h-[140px] overflow-y-auto font-sans">
                            {comanda.items.length === 0 ? (
                              <p className="text-[11px] text-neutral-600 italic py-2">Nenhum item adicionado à comanda.</p>
                            ) : (
                              comanda.items.map((item) => (
                                <div key={item.id + '-' + item.type} className="flex justify-between items-center text-xs text-neutral-300">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 py-0.2 rounded shrink-0">
                                      {item.type === 'service' ? 'Serviço' : 'Produto'}
                                    </span>
                                    <span className="truncate max-w-[100px] font-medium" title={item.name}>{item.name}</span>
                                    <span className="text-[10px] text-neutral-500">x{item.quantity}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-neutral-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                    <button
                                      onClick={() => handleRemoveItemFromComanda(comanda.id, item.id, item.type)}
                                      className="text-neutral-600 hover:text-neutral-300 p-0.5 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 font-bold"
                                    >
                                      -
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          {/* Total and Actions */}
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-neutral-500 uppercase tracking-wider font-extrabold">Total Acumulado:</span>
                            <span className="text-base font-black text-[#eab308] font-mono">
                              R$ {comanda.totalPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedComandaForItems(comanda);
                                setShowAddItemModal(true);
                              }}
                              className="flex-1 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 hover:text-white rounded-xl text-[11px] font-bold transition-all text-neutral-400 flex items-center justify-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Lançar Itens
                            </button>
                            <button
                              disabled={comanda.items.length === 0}
                              onClick={() => {
                                setClosingComanda(comanda);
                                setComandaPaymentMethod('PIX');
                              }}
                              className="flex-1 py-2 bg-[#eab308] hover:bg-[#ca8a04] disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Fechar Conta
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {comandas.filter(c => c.status === 'open').length === 0 && (
                      <div className="col-span-full py-12 text-center text-neutral-500 border border-neutral-850 rounded-2xl bg-neutral-900/10">
                        <Receipt className="h-8 w-8 mx-auto text-neutral-600 stroke-[1.5] mb-2" />
                        <p className="text-sm font-semibold">Nenhuma comanda aberta no momento.</p>
                        <p className="text-xs text-neutral-600 mt-1">Abra comandas para lançar os consumos dos clientes atendidos.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Closed History */}
                <div className="space-y-4">
                  <div className="border-b border-neutral-800 pb-2">
                    <h3 className="text-sm uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      Histórico Fechado ({comandas.filter(c => c.status === 'closed').length})
                    </h3>
                  </div>

                  <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-4 max-h-[460px] overflow-y-auto space-y-3 divide-y divide-neutral-900">
                    {comandas.filter(c => c.status === 'closed').map((comanda, idx) => (
                      <div key={comanda.id} className={`pt-3 ${idx === 0 ? 'pt-0' : ''} space-y-2`}>
                        <div className="flex justify-between text-xs">
                          <div>
                            <span className="font-mono text-[9px] text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                              {comanda.code}
                            </span>
                            <h5 className="font-bold text-white mt-1">{comanda.clientName}</h5>
                            <p className="text-[9px] text-neutral-500 mt-0.5">Barbeiro: {comanda.barberName}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-emerald-500 font-extrabold">
                              R$ {comanda.totalPrice.toFixed(2)}
                            </span>
                            <div className="mt-1">
                              <span className="text-[8px] bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                {comanda.paymentMethod || 'PIX'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-neutral-500 bg-[#222]/20 p-2 rounded-lg font-sans">
                          {comanda.items.map((i, itIdx) => (
                            <span key={i.id + i.type} className="inline-block mr-3">
                              {i.name} (x{i.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {comandas.filter(c => c.status === 'closed').length === 0 && (
                      <p className="text-xs text-neutral-500 text-center py-6">Nenhuma comanda fechada recentemente.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Catálogo de Produtos</h2>
                  <p className="text-xs text-neutral-400 mt-1">Gerencie os produtos para venda direta aos clientes.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductName('');
                    setProductPrice('');
                    setProductStock('');
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer font-sans"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo Produto
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {products.map((product) => (
                  <div key={product.id} className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-[#eab308]/40 transition-all group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-[#eab308] bg-[#eab308]/5 border border-[#eab308]/15 px-2 py-1 rounded">
                          <Package className="h-3 w-3" /> Produto
                        </span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditProductClick(product)}
                            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded cursor-pointer"
                            title="Deletar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-base font-bold text-white tracking-tight">{product.name}</h4>
                          <span className="text-sm font-black text-[#eab308] font-mono shrink-0">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500 font-semibold uppercase">
                      <span className="flex items-center gap-1.5 font-mono">
                        Quantidade:
                        {product.stock <= 0 ? (
                          <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-black font-sans text-[9px] tracking-wider animate-pulse">Esgotado</span>
                        ) : product.stock < 5 ? (
                          <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-black font-sans text-[9px] tracking-wider font-mono">{product.stock} un (Baixo)</span>
                        ) : (
                          <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-black font-sans text-[9px] tracking-wider font-mono">{product.stock} un</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-12 text-center text-neutral-500 border border-neutral-850 rounded-2xl bg-neutral-900/10">
                    <Package className="h-8 w-8 mx-auto text-neutral-600 stroke-[1.5] mb-2" />
                    <p className="text-sm font-semibold">Nenhum produto cadastrado no catálogo.</p>
                    <p className="text-xs text-neutral-600 mt-1">Adicione produtos de revenda para sua barbearia.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Catalog Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Catálogo de Serviços</h2>
                  <p className="text-xs text-neutral-400 mt-1">Gerencie os preços, duração e descrição dos serviços oferecidos.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceModal(true);
                  }}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Novo Serviço
                </button>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div key={service.id} className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-[#eab308]/40 transition-all group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-xs font-semibold text-neutral-300">
                          {service.category}
                        </span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditServiceClick(service)}
                            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded"
                            title="Deletar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="text-base font-bold text-white tracking-tight">{service.name}</h4>
                          <span className="text-sm font-black text-[#eab308] font-mono shrink-0">
                            R$ {service.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                          {service.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500 font-semibold uppercase">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.durationMin} Minutos
                      </span>
                      {service.popular && (
                        <span className="bg-[#eab308]/10 text-[#eab308] px-2 py-0.5 rounded text-[9px] font-black tracking-wider">
                          Destaque
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professionals/Staff Tab */}
          {activeTab === 'professionals' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Equipe / Barbeiros</h2>
                  <p className="text-xs text-neutral-400 mt-1">Gerencie a equipe e acompanhe o desempenho individual.</p>
                </div>
                <button
                  onClick={() => {
                    const initialServices: Record<string, { enabled: boolean; customPrice?: number }> = {};
                    services.forEach(s => {
                      initialServices[s.id] = { enabled: true, customPrice: s.price };
                    });
                    setProfServices(initialServices);
                    setShowProfModal(true);
                  }}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Barbeiro
                </button>
              </div>

              {/* Staff grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionals.map((prof) => {
                  const servicesDone = appointments.filter(a => a.status === 'completed' && a.barberId === prof.id).length;
                  const revenueGenerated = appointments
                    .filter(a => a.status === 'completed' && a.barberId === prof.id)
                    .reduce((sum, current) => sum + (current.totalPrice ?? current.servicePrice), 0);

                  return (
                    <div key={prof.id} className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4 relative">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 pr-[110px]">
                          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-neutral-800 bg-neutral-800 flex items-center justify-center text-white font-extrabold text-sm">
                            {prof.avatarUrl ? (
                              <img src={prof.avatarUrl} alt={prof.name} className="w-full h-full object-cover" />
                            ) : (
                              prof.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">{prof.name}</h4>
                            <p className="text-xs text-[#eab308] font-semibold">{prof.specialty || 'Barbeiro'}</p>
                          </div>
                        </div>

                        <div className="absolute top-5 right-5 flex items-center gap-1">
                          <button
                            onClick={() => {
                              setAbsenceBarber(prof);
                              setNewAbsenceDate('');
                              setShowAbsenceModal(true);
                            }}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                            title="Gerenciar Faltas/Folgas"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditProfClick(prof)}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
                            title="Editar Barbeiro"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {prof.id !== owner.id && prof.id !== 'warley' && (
                            <button
                              onClick={() => handleDeleteProf(prof.id, prof.name)}
                              className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                              title="Excluir Barbeiro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-3 bg-[#1e1e1e] rounded-xl text-xs font-medium border border-neutral-900">
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase">Cortes Hoje</p>
                          <p className="text-white font-bold mt-0.5">{servicesDone} finalizados</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase">Comissão</p>
                          <p className="text-yellow-500 font-bold mt-0.5">{prof.commissionPercent !== undefined ? prof.commissionPercent : 50}%</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-[10px] uppercase">Giro Bruto</p>
                          <p className="text-[#eab308] font-bold mt-0.5 font-mono">R$ {revenueGenerated.toFixed(2)}</p>
                        </div>
                      </div>

                      {prof.password && (
                        <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-xs flex justify-between items-center gap-2">
                          <span className="text-neutral-400 shrink-0">Senha de Acesso:</span>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="font-mono text-[#eab308] bg-[#222] px-2 py-1 rounded font-bold tracking-wider truncate">
                              {revealedPasswords[prof.id] ? prof.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRevealPassword(prof)}
                              className="text-neutral-400 hover:text-white shrink-0 p-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
                              title={revealedPasswords[prof.id] ? "Esconder Senha" : "Ver Senha"}
                            >
                              {revealedPasswords[prof.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold pt-1.5 border-t border-neutral-900/60">
                        <button
                          type="button"
                          onClick={() => setSelectedBarberForReviews(prof)}
                          className="flex items-center gap-1 text-left hover:text-[#eab308] hover:bg-neutral-800/50 px-2 py-1 rounded-xl transition-all group cursor-pointer"
                          title="Clique para ver as avaliações deste barbeiro"
                        >
                          <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308] group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-neutral-300 group-hover:text-[#eab308]">{prof.rating || 5.0}</span>
                          <span className="text-[10px] text-neutral-500">({prof.ratingCount || 0} avaliações)</span>
                          <span className="text-[9px] ml-1 text-[#eab308] underline underline-offset-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver</span>
                        </button>
                        <span className="text-yellow-500 bg-[#eab308]/10 px-2 py-0.5 rounded uppercase text-[9px] font-black tracking-wider">
                          Ativo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Profile Tab (EXCLUSIVE OWNER) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Editar Perfil do Proprietário</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Gerencie sua identidade, foto de perfil, dados de contato e senha de acesso administrativo.
                </p>
              </div>

              {ownerSaveSuccess && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-3 text-yellow-400 text-xs font-bold animate-pulse">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>Perfil atualizado com sucesso! As alterações já estão sincronizadas com o banco de dados Supabase.</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Card Column */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500 to-amber-600"></div>
                    
                    <div className="pt-4 flex justify-center">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#eab308]/30 mx-auto">
                          <img 
                            src={ownerAvatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwtCWKNLIK_u2P5-naL0LA1CAvmpK46ibnXcXmdT6DXbmbUNNrGXEHehoT92yOy-_APPwQtM9AH3ivWPcWw_hXSvU0PCQYB9M28Xh0sXWOwSQL82hCSwKAs9_X3N1FMWIMOGsTTlfKs_znWA0d6PejuZMQMlu5hzyi0G_YGTNESq3vkN99wvGPEs3-0fTjBR8qGRyc7MFlc0I9XQfhNJ_nOqRV6ymonhHCo6Pt-wJlXaq7U-ezXwz03YexCd-nHgRHIIuzbmfBex52'} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base tracking-tight">{ownerName || 'Proprietário'}</h3>
                      <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider mt-0.5">Dono da Barbearia</p>
                    </div>

                    <div className="pt-2 border-t border-neutral-900 text-xs text-left space-y-2 text-neutral-400">
                      <div className="flex justify-between">
                        <span>E-mail:</span>
                        <span className="text-white font-medium truncate max-w-[180px]">{ownerEmail || 'Não definido'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Telefone:</span>
                        <span className="text-white font-medium">{ownerPhone || 'Não definido'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Box */}
                  <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Foto de Perfil</h4>
                    
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={handleOwnerDragOver}
                      onDragLeave={handleOwnerDragLeave}
                      onDrop={handleOwnerDrop}
                      onClick={() => document.getElementById('owner-profile-file-input')?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        isDraggingOwner
                          ? 'border-[#eab308] bg-[#eab308]/5'
                          : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="file"
                        id="owner-profile-file-input"
                        accept="image/*"
                        onChange={handleOwnerFileChange}
                        className="hidden"
                      />
                      <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${isDraggingOwner ? 'text-[#eab308]' : 'text-neutral-500'}`} />
                      <p className="text-xs font-bold text-neutral-300">Arraste sua foto aqui</p>
                      <p className="text-[10px] text-neutral-500 mt-1">ou clique para selecionar (Máx 2MB)</p>
                    </div>

                    {ownerUploadError && (
                      <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center">
                        {ownerUploadError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Form Column */}
                <div className="lg:col-span-8 bg-[#161616] border border-neutral-800 rounded-3xl p-6">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!ownerName || !ownerEmail) return;

                    const updatedOwner: User = {
                      ...owner,
                      name: ownerName,
                      email: ownerEmail,
                      phone: ownerPhone,
                      avatarUrl: ownerAvatarUrl,
                      password: ownerPassword,
                      commissionPercent: ownerCommissionPercent
                    };

                    onUpdateOwner(updatedOwner);
                    setOwnerSaveSuccess(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => setOwnerSaveSuccess(false), 4000);
                  }} className="space-y-5">
                    
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-900 pb-2">Informações Pessoais</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Nome Completo</label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Warley"
                          className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Telefone de Contato</label>
                        <input
                          type="tel"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          placeholder="(11) 98888-7777"
                          className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">E-mail de Acesso</label>
                        <input
                          type="email"
                          required
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="proprietario@barbearia.com"
                          className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1.5">Trocar Senha</label>
                        <div className="relative">
                          <input
                            type={showOwnerProfilePassword ? "text" : "password"}
                            required
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            placeholder="Defina sua nova senha"
                            className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono tracking-wider font-bold pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOwnerProfilePassword(!showOwnerProfilePassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                            title={showOwnerProfilePassword ? "Esconder senha" : "Ver senha"}
                          >
                            {showOwnerProfilePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">Sua senha mestra para entrar no painel de administração.</p>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-900 pb-2 pt-2">Configurações Financeiras</h3>
                    
                    <div className="bg-neutral-900/40 border border-neutral-800/60 p-5 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Sua Comissão de Atendimento (%)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={ownerCommissionPercent}
                            onChange={(e) => setOwnerCommissionPercent(Number(e.target.value))}
                            className="w-full accent-[#eab308] cursor-pointer"
                          />
                          <span className="text-sm font-mono font-bold text-[#eab308] bg-[#222] border border-neutral-800 px-3 py-1.5 rounded-xl w-18 text-center shrink-0">
                            {ownerCommissionPercent}%
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1.5">
                          Defina sua comissão pessoal sobre os serviços que você (Warley) realizar. Isso é usado para calcular suas comissões estimadas no painel da equipe.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-900 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-sm rounded-xl cursor-pointer shadow-lg shadow-[#eab308]/15 flex items-center gap-2 transition-all hover:scale-[1.02]"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                        Salvar Dados do Perfil
                      </button>
                    </div>

                  </form>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#121212] border-t border-neutral-800 h-16 flex items-center justify-start overflow-x-auto gap-1.5 px-4 z-20 shadow-2xl hide-scrollbar select-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <Grid className="h-4.5 w-4.5" />
            <span>Início</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'finance' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            <span>Finanças</span>
          </button>
          <button
            onClick={() => setActiveTab('comanda')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'comanda' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <Receipt className="h-4.5 w-4.5" />
            <span>Comandas</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'products' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <Package className="h-4.5 w-4.5" />
            <span>Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'services' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <Tag className="h-4.5 w-4.5" />
            <span>Serviços</span>
          </button>
          <button
            onClick={() => setActiveTab('professionals')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'professionals' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <Users className="h-4.5 w-4.5" />
            <span>Equipe</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center p-2 text-[11px] font-extrabold gap-1 shrink-0 min-w-[76px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-[#eab308] bg-yellow-500/5' : 'text-neutral-500'
            }`}
          >
            <UserIcon className="h-4.5 w-4.5" />
            <span>Perfil</span>
          </button>
        </nav>
      </main>

      {/* MODAL 1: Create/Edit Service */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">
              {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Corte Degradê Navalhado"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="Ex: 55.00"
                    className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Duração (Min)</label>
                  <input
                    type="number"
                    required
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    placeholder="30"
                    className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Categoria</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm cursor-pointer"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Estética">Estética</option>
                  <option value="Química">Química</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Descrição</label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Explique os diferenciais deste serviço..."
                  rows={3}
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-popular"
                  checked={servicePopular}
                  onChange={(e) => setServicePopular(e.target.checked)}
                  className="h-4 w-4 bg-[#222] border border-neutral-800 rounded text-[#eab308] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-popular" className="text-xs text-neutral-300 font-medium cursor-pointer">
                  Marcar como Serviço Popular (Destaque)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Edit Professional */}
      {showProfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">
              {editingProf ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}
            </h3>

            <form onSubmit={handleSaveProf} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Ex: Luiz Eduardo"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Email de Acesso</label>
                <input
                  type="email"
                  required
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  placeholder="exemplo@barbearia.com"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Telefone Celular</label>
                <input
                  type="tel"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Senha de Acesso Única</label>
                <input
                  type="text"
                  required
                  value={profPassword}
                  onChange={(e) => setProfPassword(e.target.value)}
                  placeholder="Defina uma senha única para o barbeiro"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
                <p className="text-[10px] text-neutral-500 mt-1">O barbeiro usará esta senha para entrar no sistema como Equipe.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Especialidade / Título</label>
                <select
                  value={profSpecialty}
                  onChange={(e) => setProfSpecialty(e.target.value)}
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm cursor-pointer"
                >
                  <option value="Barbeiro Sênior">Barbeiro Sênior</option>
                  <option value="Barbeiro Premium">Barbeiro Premium</option>
                  <option value="Especialista em Barba">Especialista em Barba</option>
                  <option value="Master Barber">Master Barber</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Comissão (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={profCommissionPercent}
                    onChange={(e) => setProfCommissionPercent(Number(e.target.value))}
                    className="w-full accent-[#eab308] cursor-pointer"
                  />
                  <span className="text-sm font-mono font-bold text-[#eab308] bg-[#222] border border-neutral-800 px-2.5 py-1.5 rounded-lg w-16 text-center">
                    {profCommissionPercent}%
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">Defina a porcentagem de comissão deste profissional sobre cada serviço executado.</p>
              </div>

              <div className="border-t border-neutral-850 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛠️ Serviços & Preços Customizados</span>
                </h4>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Marque quais serviços este profissional executa. Defina preços customizados caso o custo para este barbeiro seja diferente (ex: R$ 80 com o Warley e R$ 70 com os outros).
                </p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {services.map(s => {
                    const cfg = profServices[s.id] || { enabled: true, customPrice: s.price };
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-850 rounded-xl gap-2 transition-all hover:border-neutral-800">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={(e) => {
                              setProfServices(prev => ({
                                ...prev,
                                [s.id]: { ...cfg, enabled: e.target.checked }
                              }));
                            }}
                            className="w-4 h-4 rounded accent-[#eab308] border-neutral-800 bg-[#222] cursor-pointer"
                          />
                          <div className="text-left">
                            <span className="text-xs font-black text-white block leading-tight">{s.name}</span>
                            <span className="text-[9px] text-neutral-500 font-medium font-mono">Preço padrão: R$ {s.price}</span>
                          </div>
                        </div>
                        
                        {cfg.enabled && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-neutral-500 font-mono">R$</span>
                            <input
                              type="number"
                              min="0"
                              value={cfg.customPrice !== undefined ? cfg.customPrice : s.price}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                setProfServices(prev => ({
                                  ...prev,
                                  [s.id]: { ...cfg, customPrice: val }
                                }));
                              }}
                              className="w-16 bg-[#222] border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white text-right font-mono font-bold focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfModal(false);
                    setEditingProf(null);
                    setProfName('');
                    setProfEmail('');
                    setProfPhone('');
                    setProfSpecialty('Barbeiro');
                    setProfPassword('');
                    setProfCommissionPercent(50);
                  }}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold cursor-pointer"
                >
                  {editingProf ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Absence Management */}
      {showAbsenceModal && absenceBarber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowAbsenceModal(false);
                setAbsenceBarber(null);
              }}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white hover:bg-neutral-850 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              <span>Gerenciar Ausências / Faltas</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Configure os dias de falta ou folga para <strong>{absenceBarber.name}</strong>. Ele(a) ficará indisponível para agendamentos nestas datas.
            </p>

            {/* Add Absence Form */}
            <div className="mt-5 p-4 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Registrar Nova Ausência</h4>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newAbsenceDate}
                  onChange={(e) => setNewAbsenceDate(e.target.value)}
                  className="flex-1 bg-[#222] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#eab308]"
                />
                <button
                  onClick={() => {
                    if (!newAbsenceDate) return;
                    const exists = (absenceBarber.absences || []).includes(newAbsenceDate);
                    if (exists) return;
                    const updatedAbsences = [...(absenceBarber.absences || []), newAbsenceDate].sort();
                    
                    // Update user local state & sync
                    setUsers(prev => prev.map(u => u.id === absenceBarber.id ? {
                      ...u,
                      absences: updatedAbsences
                    } : u));
                    
                    setAbsenceBarber(prev => prev ? { ...prev, absences: updatedAbsences } : null);
                    setNewAbsenceDate('');
                  }}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Absences List */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Ausências Agendadas</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(!absenceBarber.absences || absenceBarber.absences.length === 0) ? (
                  <p className="text-xs text-neutral-500 italic py-3 text-center">Nenhuma ausência cadastrada. O profissional está ativo todos os dias.</p>
                ) : (
                  absenceBarber.absences.map(dateStr => {
                    const [year, month, day] = dateStr.split('-');
                    const formattedDate = `${day}/${month}/${year}`;
                    return (
                      <div key={dateStr} className="flex items-center justify-between p-2.5 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                        <span className="text-xs text-white font-mono font-bold">{formattedDate}</span>
                        <button
                          onClick={() => {
                            const updatedAbsences = (absenceBarber.absences || []).filter(d => d !== dateStr);
                            
                            // Update user local state & sync
                            setUsers(prev => prev.map(u => u.id === absenceBarber.id ? {
                              ...u,
                              absences: updatedAbsences
                            } : u));
                            
                            setAbsenceBarber(prev => prev ? { ...prev, absences: updatedAbsences } : null);
                          }}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                          title="Remover Ausência"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-neutral-850">
              <button
                onClick={() => {
                  setShowAbsenceModal(false);
                  setAbsenceBarber(null);
                }}
                className="px-5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Receive Payment & Complete Appointment */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-3">Registrar Recebimento</h3>
            <p className="text-xs text-neutral-400 mb-4">Selecione o método de pagamento para finalizar o serviço do cliente.</p>

            <div className="p-3 bg-neutral-900 rounded-xl text-xs font-medium space-y-1 border border-neutral-800/50 mb-5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Serviço:</span>
                <span className="text-white font-bold">{completingApt.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cliente:</span>
                <span className="text-white font-bold">{completingApt.clientName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-800 font-mono text-[#eab308]">
                <span>Total a Pagar:</span>
                <span className="font-bold">R$ {completingApt.servicePrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-400 uppercase">Forma de Recebimento</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PIX', 'Dinheiro', 'Cartão'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'
                        : 'border-transparent bg-[#222] text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCompleteApt}
                className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Finalizar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE PROFESSIONAL MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Excluir Barbeiro</h3>
                <p className="text-[11px] text-neutral-400">Esta ação é irreversível.</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Deseja realmente remover o barbeiro <strong className="text-white">{deleteConfirmUser.name}</strong>? Seus agendamentos e avaliações também serão afetados.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProf}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE SERVICE MODAL */}
      {deleteConfirmService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Excluir Serviço</h3>
                <p className="text-[11px] text-neutral-400">Esta ação é irreversível.</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Deseja realmente excluir o serviço <strong className="text-white">{deleteConfirmService.name}</strong> do catálogo?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmService(null)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteService}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER PASSWORD VERIFICATION MODAL FOR SENSITIVE ACTIONS */}
      {showOwnerPasswordVerifyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex items-center gap-3 text-[#eab308] mb-4">
              <div className="p-2 rounded-xl bg-[#eab308]/10 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Verificação de Segurança</h3>
                <p className="text-[11px] text-neutral-400">Senha administrativa necessária.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyOwnerPasswordSubmit} className="space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Para visualizar ou alterar os dados de acesso deste barbeiro, insira sua <strong>Senha de Proprietário</strong>:
              </p>

              <div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={ownerVerifyPasswordInput}
                  onChange={(e) => {
                    setOwnerVerifyPasswordInput(e.target.value);
                    setOwnerVerifyError('');
                  }}
                  placeholder="Sua senha de proprietário"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono tracking-wider text-center"
                />
                {ownerVerifyError && (
                  <p className="text-rose-500 font-bold text-[11px] mt-1.5 text-center">{ownerVerifyError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOwnerPasswordVerifyModal(false);
                    setOwnerVerifyPasswordInput('');
                    setOwnerVerifyError('');
                    setOnVerifySuccess(null);
                  }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Create / Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative font-sans">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Pomada Efeito Matte Premium"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Valor de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ex: 45.00"
                    className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Qtd no Estoque</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                    setProductName('');
                    setProductPrice('');
                    setProductStock('');
                  }}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold cursor-pointer"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Comanda */}
      {showComandaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4">
              Abrir Nova Comanda
            </h3>

            <form onSubmit={handleCreateComanda} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  value={comandaClientName}
                  onChange={(e) => setComandaClientName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">Barbeiro Designado</label>
                <select
                  value={comandaBarberId}
                  onChange={(e) => setComandaBarberId(e.target.value)}
                  className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-sm cursor-pointer"
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowComandaModal(false)}
                  className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold cursor-pointer"
                >
                  Abrir Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Add Item to Comanda */}
      {showAddItemModal && selectedComandaForItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-xl p-6 relative flex flex-col max-h-[85vh]">
            <div className="mb-4">
              <span className="text-[10px] font-mono font-bold text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded">
                Lançamento {selectedComandaForItems.code}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                Lançar Itens para: <span className="text-[#eab308]">{selectedComandaForItems.clientName}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">Adicione serviços e produtos consumidos pelo cliente à sua comanda ativa.</p>
            </div>

            {/* Main content - 2 columns inside modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-1 flex-1 py-1">
              
              {/* Left Column: List of Services */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-extrabold border-b border-neutral-800 pb-1 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#eab308]" /> Serviços Disponíveis
                </h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {services.map(service => (
                    <div key={service.id} className="p-2.5 bg-neutral-900 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs hover:border-neutral-700 transition-colors">
                      <div>
                        <p className="font-bold text-white">{service.name}</p>
                        <p className="font-mono text-[10px] text-[#eab308] mt-0.5">R$ {service.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => handleAddItemToComanda(selectedComandaForItems.id, {
                          id: service.id,
                          name: service.name,
                          type: 'service',
                          price: service.price
                        })}
                        className="px-2 py-1 bg-neutral-800 hover:bg-[#eab308] hover:text-black text-[#eab308] text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        + Lançar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: List of Products */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-extrabold border-b border-neutral-800 pb-1 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-[#eab308]" /> Produtos em Estoque
                </h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {products.map(product => (
                    <div key={product.id} className="p-2.5 bg-neutral-900 border border-neutral-800/80 rounded-xl flex items-center justify-between text-xs hover:border-neutral-700 transition-colors">
                      <div>
                        <p className="font-bold text-white">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-[#eab308]">R$ {product.price.toFixed(2)}</span>
                          <span className="text-[9px] text-neutral-500 font-mono">Estoque: {product.stock} un</span>
                        </div>
                      </div>
                      <button
                        disabled={product.stock <= 0}
                        onClick={() => handleAddItemToComanda(selectedComandaForItems.id, {
                          id: product.id,
                          name: product.name,
                          type: 'product',
                          price: product.price
                        })}
                        className="px-2 py-1 bg-neutral-800 hover:bg-[#eab308] hover:text-black text-[#eab308] disabled:bg-neutral-950 disabled:text-neutral-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                      >
                        {product.stock <= 0 ? 'Esgotado' : '+ Lançar'}
                      </button>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <p className="text-[11px] text-neutral-500 italic py-2 text-center">Nenhum produto cadastrado no catálogo.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Current items summary inside modal */}
            <div className="mt-4 pt-4 border-t border-neutral-800">
              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800/80 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold block">Total Atual da Comanda</span>
                  <span className="text-xl font-black text-[#eab308] font-mono">
                    R$ {comandas.find(c => c.id === selectedComandaForItems.id)?.totalPrice.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-neutral-500 font-extrabold block">Total Itens Lançados</span>
                  <span className="text-sm font-bold text-white font-mono">
                    {comandas.find(c => c.id === selectedComandaForItems.id)?.items.reduce((sum, i) => sum + i.quantity, 0) || 0} itens
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSelectedComandaForItems(null);
                  }}
                  className="px-6 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-[#eab308]/15"
                >
                  Concluir Lançamentos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Close Comanda & Checkout */}
      {closingComanda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-bold text-white tracking-tight mb-3">Fechar Conta & Finalizar</h3>
            <p className="text-xs text-neutral-400 mb-4">Selecione o método de pagamento para liquidar esta comanda de consumo.</p>

            <div className="p-3.5 bg-neutral-900 rounded-xl text-xs font-medium space-y-2 border border-neutral-800/50 mb-5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Código Comanda:</span>
                <span className="text-white font-bold font-mono">{closingComanda.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cliente:</span>
                <span className="text-white font-bold">{closingComanda.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Atendido por:</span>
                <span className="text-white font-bold">{closingComanda.barberName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-800 font-mono text-[#eab308] text-sm">
                <span>Total a Receber:</span>
                <span className="font-black text-base">R$ {closingComanda.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseComanda} className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-400 uppercase">Forma de Recebimento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'Dinheiro', 'Cartão'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setComandaPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        comandaPaymentMethod === method
                          ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'
                          : 'border-transparent bg-[#222] text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setClosingComanda(null)}
                  className="px-4 py-2.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#eab308]/15"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Finalizar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Excluir Produto</h3>
                <p className="text-[11px] text-neutral-400">Esta ação é irreversível.</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Deseja realmente remover o produto <strong className="text-white">{deleteConfirmProduct.name}</strong> do catálogo de vendas?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE COMANDA CONFIRMATION MODAL */}
      {deleteConfirmComanda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-sm p-6 relative">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Cancelar Comanda</h3>
                <p className="text-[11px] text-neutral-400">Esta ação é irreversível.</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-300 leading-relaxed mb-6">
              Deseja realmente cancelar a comanda <strong className="text-white">{deleteConfirmComanda.code}</strong>? Os itens lançados serão descartados e os estoques de produtos serão devolvidos.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmComanda(null)}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteComanda}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: Add / View Calendar Appointment */}
      {showAddCalendarAptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowAddCalendarAptModal(false);
                setSelectedCalendarApt(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {selectedCalendarApt ? (
              // VIEWING EXISTING APPOINTMENT DETAILS
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                  <div className="p-2.5 bg-[#eab308]/10 text-[#eab308] rounded-xl border border-[#eab308]/15">
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">ID: {selectedCalendarApt.id.slice(0, 8)}</span>
                    <h3 className="text-base font-black text-white tracking-tight leading-tight mt-0.5">
                      {selectedCalendarApt.serviceName}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-neutral-300">
                  <div className="grid grid-cols-2 gap-4 bg-neutral-950/40 p-3 rounded-xl border border-neutral-850/50 font-sans">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Cliente</span>
                      <strong className="text-white font-black text-xs">{selectedCalendarApt.clientName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Telefone</span>
                      <strong className="text-white font-mono text-xs">{selectedCalendarApt.clientPhone}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-neutral-900/30 p-2.5 rounded-xl border border-neutral-900">
                    <div>
                      <span className="text-[9px] text-neutral-500 font-bold block uppercase">Barbeiro</span>
                      <span className="text-neutral-200 font-bold truncate block text-xs">{selectedCalendarApt.barberName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 font-bold block uppercase">Data</span>
                      <span className="text-neutral-200 font-mono font-bold block text-xs">{selectedCalendarApt.date.split('-').reverse().join('/')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 font-bold block uppercase">Horário</span>
                      <span className="text-[#eab308] font-mono font-bold block text-xs">{selectedCalendarApt.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#eab308]/5 border border-[#eab308]/10 rounded-xl">
                    <span className="text-neutral-400 font-medium">Status do Serviço:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      selectedCalendarApt.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : selectedCalendarApt.status === 'active'
                          ? 'bg-sky-500/20 text-sky-400'
                          : 'bg-[#eab308]/20 text-[#eab308]'
                    }`}>
                      {selectedCalendarApt.status === 'completed' ? 'Finalizado' : selectedCalendarApt.status === 'active' ? 'Em Atendimento' : 'Pendente / Agendado'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-neutral-800">
                  {selectedCalendarApt.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          updateAptStatus(selectedCalendarApt.id, 'active');
                          setShowAddCalendarAptModal(false);
                          setSelectedCalendarApt(null);
                        }}
                        className="w-full py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                        Iniciar Atendimento Agora
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateAptStatus(selectedCalendarApt.id, 'cancelled');
                          setShowAddCalendarAptModal(false);
                          setSelectedCalendarApt(null);
                        }}
                        className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-red-400 hover:text-red-300 border border-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        Cancelar Agendamento
                      </button>
                    </>
                  )}

                  {selectedCalendarApt.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => {
                        const aptToComplete = selectedCalendarApt;
                        setShowAddCalendarAptModal(false);
                        setSelectedCalendarApt(null);
                        startCompleteApt(aptToComplete);
                      }}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      Finalizar e Receber R$ {selectedCalendarApt.servicePrice.toFixed(2)}
                    </button>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteCalendarApt(selectedCalendarApt.id)}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 font-bold rounded-lg text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir Registro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCalendarAptModal(false);
                        setSelectedCalendarApt(null);
                      }}
                      className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // CREATING NEW QUICK APPOINTMENT FROM CALENDAR SLOT
              <div>
                <div className="flex items-center gap-2 mb-4 font-sans">
                  <div className="p-2 bg-[#eab308]/10 text-[#eab308] rounded-lg border border-[#eab308]/20">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">Novo Agendamento Rápido</h3>
                    <p className="text-[10px] text-neutral-400">Preenchimento direto no painel da agenda.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateCalendarAppointment} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      required
                      value={calendarAptClientName}
                      onChange={(e) => setCalendarAptClientName(e.target.value)}
                      placeholder="Ex: Warley Souza"
                      className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Telefone (Opcional)</label>
                    <input
                      type="text"
                      value={calendarAptClientPhone}
                      onChange={(e) => setCalendarAptClientPhone(e.target.value)}
                      placeholder="Ex: (31) 98888-8888"
                      className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Serviço Desejado</label>
                    <select
                      value={calendarAptServiceId}
                      onChange={(e) => setCalendarAptServiceId(e.target.value)}
                      className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-xs cursor-pointer"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-neutral-950/30 p-3 rounded-xl border border-neutral-900">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Data</label>
                      <input
                        type="date"
                        required
                        value={calendarAptDate}
                        onChange={(e) => setCalendarAptDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-[#eab308] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Horário</label>
                      <input
                        type="text"
                        required
                        value={calendarAptTime}
                        onChange={(e) => setCalendarAptTime(e.target.value)}
                        placeholder="Ex: 14:30"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:ring-1 focus:ring-[#eab308] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Barbeiro Selecionado</label>
                    <select
                      value={calendarAptBarberId}
                      onChange={(e) => setCalendarAptBarberId(e.target.value)}
                      className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-[#eab308] focus:border-transparent outline-none text-xs cursor-pointer"
                    >
                      {professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCalendarAptModal(false);
                        setCalendarAptClientName('');
                        setCalendarAptClientPhone('');
                      }}
                      className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-lg text-[11px] cursor-pointer shadow-md shadow-[#eab308]/15"
                    >
                      Agendar Cliente
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: View Barber Reviews */}
      {selectedBarberForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-lg p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedBarberForReviews(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-neutral-800 shrink-0">
              <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-[#eab308] bg-neutral-800 flex items-center justify-center text-white font-extrabold text-lg">
                {selectedBarberForReviews.avatarUrl ? (
                  <img src={selectedBarberForReviews.avatarUrl} alt={selectedBarberForReviews.name} className="w-full h-full object-cover" />
                ) : (
                  selectedBarberForReviews.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  Avaliações de {selectedBarberForReviews.name}
                </h3>
                <p className="text-xs text-[#eab308] font-bold">{selectedBarberForReviews.specialty || 'Barbeiro'}</p>
                
                <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308]" />
                  <span className="font-bold text-white font-mono">{selectedBarberForReviews.rating || 5.0}</span>
                  <span>({selectedBarberForReviews.ratingCount || 0} avaliações no total)</span>
                </div>
              </div>
            </div>

            {/* Body of reviews */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[250px]">
              {(() => {
                const barberReviews = reviews.filter(r => r.barberId === selectedBarberForReviews.id);
                if (barberReviews.length === 0) {
                  return (
                    <div className="text-center py-10 space-y-2">
                      <Star className="h-8 w-8 text-neutral-700 mx-auto" />
                      <p className="text-xs text-neutral-400 font-bold">Nenhum comentário ou avaliação detalhada registrada.</p>
                      <p className="text-[10px] text-neutral-600">Este profissional possui excelente reputação baseada em agendamentos finalizados.</p>
                    </div>
                  );
                }

                return barberReviews.map((rev) => {
                  const clientUser = users.find(u => u.id === rev.clientId);
                  const avatarToUse = clientUser?.avatarUrl;

                  return (
                    <div key={rev.id} className="bg-neutral-900/60 border border-neutral-850 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-white font-black text-xs overflow-hidden">
                            {avatarToUse ? (
                              <img src={avatarToUse} alt={rev.clientName} className="w-full h-full object-cover" />
                            ) : (
                              rev.clientName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{rev.clientName}</p>
                            <p className="text-[9px] text-neutral-500 font-bold font-mono">{rev.date}</p>
                          </div>
                        </div>

                      <div className="flex items-center gap-0.5 bg-[#eab308]/10 px-2 py-1 rounded-lg">
                        <Star className="h-3 w-3 fill-[#eab308] text-[#eab308]" />
                        <span className="text-[10px] text-[#eab308] font-bold font-mono">{rev.stars}</span>
                      </div>
                    </div>

                    {rev.comment ? (
                      <p className="text-xs text-neutral-300 italic pl-1 leading-relaxed">
                        "{rev.comment}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-neutral-500 italic pl-1">
                        Avaliou com {rev.stars} estrelas sem comentário adicional.
                      </p>
                    )}
                  </div>
                );
              });
            })()}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedBarberForReviews(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
