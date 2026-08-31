import React, { useState } from 'react';
import { 
  LogOut, Star, Scissors, Check, Clock, User as UserIcon, Calendar, Award, 
  ChevronLeft, ChevronRight, Plus, Eye, Palette, Sparkles, Smile, Baby, Droplet, Info, BookOpen,
  MessageSquare, X, Mail, Phone, Lock, Camera, Save, Upload, Trash2
} from 'lucide-react';
import { Service, Appointment, AppointmentStatus, User, Review } from '../types';

interface ClientDashboardProps {
  client: User;
  onLogout: () => void;
  services: Service[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}

export default function ClientDashboard({
  client,
  onLogout,
  services,
  appointments,
  setAppointments,
  users,
  setUsers,
  reviews,
  setReviews
}: ClientDashboardProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Active view tab state
  const [activeTab, setActiveTab] = useState<'agenda' | 'reviews' | 'profile'>('agenda');
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>('all');

  // Profile Edit state
  const [editName, setEditName] = useState(client.name);
  const [editEmail, setEditEmail] = useState(client.email);
  const [editPhone, setEditPhone] = useState(client.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState(client.avatarUrl || '');
  const [editBirthDate, setEditBirthDate] = useState(client.birthDate || '');
  const [editPassword, setEditPassword] = useState(client.password || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isDraggingClient, setIsDraggingClient] = useState(false);
  const [clientUploadError, setClientUploadError] = useState('');

  const handleClientFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processClientImageFile(file);
  };

  const processClientImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setClientUploadError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    setClientUploadError('');
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
            setEditAvatarUrl(compressedBase64);
          } else {
            setEditAvatarUrl(event.target?.result as string);
          }
        };
        img.onerror = () => {
          setClientUploadError('Erro ao processar imagem.');
        };
      }
    };
    reader.onerror = () => {
      setClientUploadError('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleClientDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingClient(true);
  };

  const handleClientDragLeave = () => {
    setIsDraggingClient(false);
  };

  const handleClientDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingClient(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processClientImageFile(file);
    }
  };

  // Sync edits when client prop changes
  React.useEffect(() => {
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditAvatarUrl(client.avatarUrl || '');
    setEditBirthDate(client.birthDate || '');
    setEditPassword(client.password || '');
  }, [client]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Email e Telefone).');
      return;
    }

    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id === client.id) {
          return {
            ...u,
            name: editName,
            email: editEmail,
            phone: editPhone,
            avatarUrl: editAvatarUrl || undefined,
            birthDate: editBirthDate || undefined,
            password: editPassword || undefined
          };
        }
        return u;
      });
    });

    // Cascade name & phone updates to appointments
    setAppointments(prevApts => {
      return prevApts.map(a => {
        if (a.clientId === client.id) {
          return {
            ...a,
            clientName: editName,
            clientPhone: editPhone
          };
        }
        return a;
      });
    });

    // Cascade name update to reviews
    setReviews(prevReviews => {
      return prevReviews.map(r => {
        if (r.clientId === client.id) {
          return {
            ...r,
            clientName: editName
          };
        }
        return r;
      });
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    alert('Seu perfil foi atualizado com sucesso!');
  };

  // Evaluation state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAptToReview, setSelectedAptToReview] = useState<Appointment | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Scheduling wizard state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-07-06');
  const [selectedTime, setSelectedTime] = useState<string>('10:00');

  // Filter appointments for this specific client
  const myAppointments = appointments.filter(a => a.clientId === client.id);
  const filteredAppointments = selectedFilterDate === 'all'
    ? myAppointments
    : myAppointments.filter(a => a.date === selectedFilterDate);

  // Filter reviews for this specific client
  const myReviews = reviews.filter(r => r.clientId === client.id);

  // Statistics calculation
  const completedApts = myAppointments.filter(a => a.status === 'completed');
  const totalSpent = completedApts.reduce((sum, current) => sum + (current.totalPrice ?? current.servicePrice), 0);
  const visitsCount = completedApts.length;

  // Preferred service calculation (Corte Preferido)
  const getPreferredService = () => {
    // If the client has completed appointments, find their most frequent service
    if (completedApts.length > 0) {
      const serviceCounts: { [key: string]: number } = {};
      completedApts.forEach(apt => {
        const name = apt.serviceName;
        if (name) {
          serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        }
      });
      let preferred = '';
      let maxCount = 0;
      Object.entries(serviceCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          preferred = name;
        }
      });
      if (preferred) return preferred;
    }

    // Otherwise, find the overall most frequent completed service across all clients
    const allCompletedApts = appointments.filter(a => a.status === 'completed');
    if (allCompletedApts.length > 0) {
      const globalCounts: { [key: string]: number } = {};
      allCompletedApts.forEach(apt => {
        const name = apt.serviceName;
        if (name) {
          globalCounts[name] = (globalCounts[name] || 0) + 1;
        }
      });
      let preferred = '';
      let maxCount = 0;
      Object.entries(globalCounts).forEach(([name, count]) => {
        if (count > maxCount) {
          maxCount = count;
          preferred = name;
        }
      });
      if (preferred) return preferred;
    }

    // Fallback to first available service or "Corte Moderno"
    return services[0]?.name || 'Corte Moderno';
  };

  const preferredService = getPreferredService();

  const barbers = users.filter(u => {
    if (u.role !== 'professional' && u.role !== 'owner') return false;
    
    // Filter by selected service compatibility
    if (selectedService) {
      const config = (u.barberServices || []).find(s => s.serviceId === selectedService.id);
      if (config && !config.enabled) {
        return false;
      }
    }
    
    // Filter by selected date absences
    if (selectedDate) {
      if ((u.absences || []).includes(selectedDate)) {
        return false;
      }
    }
    
    return true;
  });

  const getFeaturedBarber = () => {
    const barbersList = users.filter(u => u.role === 'professional' || u.role === 'owner');
    if (barbersList.length === 0) return null;
    
    const erick = barbersList.find(u => u.id === 'erick' || u.name.toLowerCase().includes('erick'));
    const featured = erick || barbersList[0];
    
    const barberReviews = reviews.filter(r => r.barberId === featured.id);
    const avgRating = barberReviews.length > 0
      ? (barberReviews.reduce((sum, r) => sum + r.stars, 0) / barberReviews.length).toFixed(1)
      : '4.9';
    const reviewCount = barberReviews.length > 0 ? barberReviews.length : 124;

    return {
      barber: featured,
      rating: avgRating,
      reviewsCount: reviewCount
    };
  };

  const featuredBarber = getFeaturedBarber();

  const getFilterDates = () => {
    const dates = [];
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Todos
    dates.push({ label: 'Todos', sublabel: 'Geral', value: 'all' });
    
    // Today
    const today = new Date();
    dates.push({ label: 'Hoje', sublabel: String(today.getDate()).padStart(2, '0'), value: today.toISOString().split('T')[0] });
    
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    dates.push({ label: 'Amanhã', sublabel: String(tomorrow.getDate()).padStart(2, '0'), value: tomorrow.toISOString().split('T')[0] });
    
    // Next 5 days
    for (let i = 2; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dayName = weekdays[d.getDay()];
      dates.push({
        label: dayName,
        sublabel: dayNum,
        value: d.toISOString().split('T')[0]
      });
    }
    return dates;
  };

  const filterDates = getFilterDates();

  const handleOpenReviewModal = (apt: Appointment) => {
    setSelectedAptToReview(apt);
    setRatingStars(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedAptToReview) return;
    const newReview: Review = {
      id: 'rev-' + Date.now(),
      appointmentId: selectedAptToReview.id,
      clientId: client.id,
      clientName: client.name,
      barberId: selectedAptToReview.barberId,
      barberName: selectedAptToReview.barberName,
      stars: ratingStars,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [newReview, ...prev]);
    setShowReviewModal(false);
    setSelectedAptToReview(null);

    // Dynamically update the professional's average rating & count
    const professionalId = selectedAptToReview.barberId;
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id === professionalId) {
          const currentCount = u.ratingCount || 0;
          const currentRating = u.rating || 5.0;
          const newCount = currentCount + 1;
          const newRating = parseFloat(((currentRating * currentCount + ratingStars) / newCount).toFixed(1));
          return {
            ...u,
            rating: newRating,
            ratingCount: newCount
          };
        }
        return u;
      });
    });

    alert('Sua avaliação foi enviada com sucesso! Obrigado pelo feedback.');
  };

  const handleNextStep = () => {
    if (step === 1 && selectedService) setStep(2);
    else if (step === 2 && selectedBarber) setStep(3);
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedBarber) return;

    const barberConfig = (selectedBarber.barberServices || []).find(s => s.serviceId === selectedService.id);
    const finalPrice = barberConfig && barberConfig.customPrice !== undefined ? barberConfig.customPrice : selectedService.price;

    const newAppointment: Appointment = {
      id: 'apt-' + Date.now(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: finalPrice,
      date: selectedDate,
      time: selectedTime,
      status: 'pending'
    };

    setAppointments(prev => [newAppointment, ...prev]);
    setShowScheduleModal(false);
    
    // Reset wizard
    setStep(1);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime('10:00');
    alert('Agendamento realizado com sucesso para ' + selectedDate + ' às ' + selectedTime + '!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-16">
      
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#0e0e0e] border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eab308]/20 flex items-center justify-center text-[#eab308]">
            <Scissors className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-sm font-extrabold tracking-widest text-[#eab308] uppercase font-mono">
            Barbearia do Warley
          </h1>
        </div>

        <button
          onClick={onLogout}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs font-bold"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Perfil do Cliente</h2>
            <p className="text-neutral-400 text-xs mt-1">Gerencie suas informações, agendamentos e avaliações.</p>
          </div>
          <button
            onClick={() => {
              setSelectedService(services[0] || null);
              setSelectedBarber(barbers[0] || null);
              setShowScheduleModal(true);
            }}
            className="px-5 py-3 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#eab308]/15 cursor-pointer transform active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Agendar Novo Horário
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 gap-6">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer ${
              activeTab === 'agenda' ? 'text-[#eab308]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Histórico &amp; Pontos
            {activeTab === 'agenda' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eab308] rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews' ? 'text-[#eab308]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Avaliações ({myReviews.length})
            {activeTab === 'reviews' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eab308] rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile' ? 'text-[#eab308]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Editar Perfil
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#eab308] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'agenda' ? (
          /* Bento Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Profile Card & Featured Professional */}
            <div className="md:col-span-4 space-y-6">
              {/* Profile Card Summary */}
              <div className="bg-[#161616] border border-neutral-800 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full border-4 border-[#eab308] p-1 shrink-0">
                    <img 
                      src={client.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQFM870Nqntq9wR3UcK8owdCkBFrweYg6dxYGiHkMZ_AEdRtSuR6XJpsrv0ikCboyWrEgCILPy554uXT9zEO_H6nfkd9WNUpqhKhqdSdKhbZyPYZTBipoG46WsqEy8w5hNkmrJmpuWcieTcnWHXftx_c1ZIVgbQmzY3jqRetlVI4KzPibKMpxgUbSY4tuCstfhyi42QHtT3IPBMjIfqOY18HEoC2Jued6JL81TBRx2dt3l5qcWNnkA3vuyAAiwZW7mBRIzUCaC-UWq'} 
                      alt={client.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#eab308] rounded-full flex items-center justify-center border-4 border-[#161616]">
                    <Check className="text-black h-3 w-3 stroke-[3]" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white tracking-tight">{client.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Cliente VIP • Desde 2022</p>
                
                <div className="w-full h-px bg-neutral-800 my-4"></div>
                
                <div className="w-full space-y-3.5 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Email:</span>
                    <span className="text-neutral-300 font-semibold">{client.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Telefone:</span>
                    <span className="text-neutral-300 font-semibold font-mono">{client.phone}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="mt-5 w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserIcon className="h-3.5 w-3.5 text-[#eab308]" />
                  Editar Meu Perfil
                </button>
              </div>

              {/* Profissional em Destaque */}
              {featuredBarber && (
                <div className="bg-[#161616] border border-neutral-800 p-5 rounded-2xl space-y-3">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Profissional em Destaque
                  </p>
                  <div className="bg-[#1d1d1d] border border-neutral-800/80 p-4 rounded-xl flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-[#eab308] p-0.5 shrink-0 overflow-hidden bg-neutral-900">
                      <img 
                        src={featuredBarber.barber.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyfOr1CGt0zXoiz2wimjL3HVvuovk_QCQ786FkKyTnaKS7igANY2IILpFw4biui7pWvDp5NZhowMv1dThM5bX4U_smT5SY7SfUlUYhFlq_YyDS6fVCljqGgTVk5hArTDGt2Z7_-RO3wed9_0BTotkmVM_kuOAFJzGfO7LSZfU3yZwnK6GQZ3djhgMbp8jX5EC0naqgBa4_3sCtEZCXdr2DFeDSSqVjMIr8UzQl_fx1t1Eh7UAXTK2r71K9NgOYJettcXyQ1DzmG3-7'} 
                        alt={featuredBarber.barber.name} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm tracking-tight truncate">{featuredBarber.barber.name}</h4>
                      <p className="text-[10px] text-[#eab308] font-bold mt-0.5">{featuredBarber.barber.specialty || 'Barbeiro Premium'}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-neutral-400 font-semibold font-mono">
                        <Star className="h-3 w-3 fill-[#eab308] text-[#eab308] shrink-0" />
                        <span>{featuredBarber.rating}</span>
                        <span className="text-neutral-500 font-sans font-normal">({featuredBarber.reviewsCount} avaliações)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loyalty Tracker & Stats Cards */}
            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Points Tracker card */}
              <div className="bg-[#eab308]/5 border border-[#eab308]/20 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                    <Award className="text-[#eab308] h-9 w-9 shrink-0" />
                    <span className="bg-[#eab308]/10 text-[#eab308] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Fidelidade
                    </span>
                  </div>
                  <div>
                    <h4 className="text-5xl font-black text-[#eab308] font-mono leading-none">
                      {client.points || 0}
                    </h4>
                    <p className="text-neutral-400 text-xs font-semibold mt-1">Pontos Acumulados</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10 mt-6 space-y-2">
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#eab308] h-full shadow-[0_0_10px_rgba(0,200,83,0.5)] transition-all duration-500" 
                      style={{ width: `${Math.min(((client.points || 0) / 1000) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-neutral-300 font-semibold">
                    {client.points && client.points >= 1000 
                      ? 'Parabéns! Você tem um corte grátis disponível!' 
                      : `Faltam ${1000 - (client.points || 0)} pontos para o próximo corte grátis!`}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161616] border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Calendar className="text-neutral-400 h-5 w-5 mb-1.5 shrink-0" />
                  <span className="text-lg font-bold text-white font-mono">{visitsCount}</span>
                  <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5 tracking-wider">Visitas</span>
                </div>

                <div className="bg-[#161616] border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Clock className="text-neutral-400 h-5 w-5 mb-1.5 shrink-0" />
                  <span className="text-lg font-bold text-white font-mono">R$ {totalSpent.toFixed(0)}</span>
                  <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5 tracking-wider">Total Gasto</span>
                </div>

                <div className="bg-[#161616] border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Scissors className="text-neutral-400 h-5 w-5 mb-1.5 shrink-0" />
                  <span className="text-xs font-bold text-white truncate max-w-full" title={preferredService}>{preferredService}</span>
                  <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5 tracking-wider">Preferido</span>
                </div>

                <div className="bg-[#161616] border border-[#eab308]/20 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Star className="text-[#eab308] h-5 w-5 mb-1.5 shrink-0 fill-[#eab308]" />
                  <span className="text-lg font-bold text-white font-mono">
                    {myReviews.length > 0 
                      ? (myReviews.reduce((sum, r) => sum + r.stars, 0) / myReviews.length).toFixed(1) 
                      : '4.9'}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-neutral-500 mt-0.5 tracking-wider">Avaliação Média</span>
                </div>
              </div>

            </div>

            {/* Compromissos e Agenda Diária Section */}
            <div className="md:col-span-12 bg-[#121212] border border-neutral-800 p-6 rounded-3xl space-y-6">
              
              {/* Header inside the card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-[#eab308]/10 text-[#eab308] rounded-xl shrink-0 mt-0.5">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Compromissos e Agenda Diária</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium">
                      Gerencie seus agendamentos e compromissos importantes na Barbearia do Warley.
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedService(services[0] || null);
                    setSelectedBarber(barbers[0] || null);
                    setShowScheduleModal(true);
                  }}
                  className="px-5 py-3.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#eab308]/15 cursor-pointer transform active:scale-95 transition-all self-start md:self-auto shrink-0"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  Novo Agendamento
                </button>
              </div>

              {/* Date filters inside the card - Wrap layout to avoid scroll */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 w-full">
                {filterDates.map((dateObj) => {
                  const isActive = selectedFilterDate === dateObj.value;
                  const dayHasAppointments = myAppointments.some(a => a.date === dateObj.value || (dateObj.value === 'all' && myAppointments.length > 0));
                  return (
                    <button
                      key={dateObj.value}
                      onClick={() => setSelectedFilterDate(dateObj.value)}
                      className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border transition-all cursor-pointer select-none text-center ${
                        isActive
                          ? 'bg-[#eab308] border-[#eab308] text-black shadow-lg shadow-[#eab308]/20 font-black scale-[1.03] ring-2 ring-[#eab308]/30'
                          : 'bg-[#161616] border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-black/90' : 'text-neutral-400'}`}>
                        {dateObj.label}
                      </span>
                      <span className="text-lg md:text-xl font-black mt-1 font-mono">
                        {dateObj.sublabel}
                      </span>
                      {dayHasAppointments && (
                        <span className={`w-2 h-2 rounded-full mt-2 ${isActive ? 'bg-black animate-pulse' : 'bg-[#eab308]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Appointments list in a premium vertical timeline format */}
              <div className="space-y-5 pt-2">
                {filteredAppointments.map((apt) => {
                  const hasReview = reviews.some(r => r.appointmentId === apt.id);
                  const isCompleted = apt.status === 'completed';
                  const isPending = apt.status === 'pending';
                  const isCancelled = apt.status === 'cancelled';
                  const isActiveStatus = apt.status === 'active';
                  
                  // Status badge styling
                  let statusBg = 'bg-blue-500/10 text-blue-400 border-blue-500/25';
                  let statusText = 'Pendente';
                  if (isCompleted) {
                    statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
                    statusText = 'Concluído';
                  } else if (isCancelled) {
                    statusBg = 'bg-rose-500/10 text-rose-400 border-rose-500/25';
                    statusText = 'Cancelado';
                  } else if (isActiveStatus) {
                    statusBg = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
                    statusText = 'Em Atendimento';
                  }

                  return (
                    <div 
                      key={apt.id} 
                      className={`bg-[#161616] border-l-4 ${
                        isCompleted ? 'border-l-emerald-500' : isCancelled ? 'border-l-rose-500' : isActiveStatus ? 'border-l-amber-500' : 'border-l-[#eab308]'
                      } border border-neutral-800 hover:border-neutral-700 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all shadow-md`}
                    >
                      {/* Left: Time and Service info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5 md:gap-8 min-w-0 w-full md:w-auto">
                        {/* Time box */}
                        <div className="flex sm:flex-col items-center justify-center bg-neutral-950/80 border border-neutral-800 py-4 px-6 rounded-2xl min-w-[120px] shrink-0 text-center gap-3 sm:gap-1.5 shadow-inner">
                          <Clock className="h-6 w-6 text-[#eab308] sm:mb-1.5 shrink-0" />
                          <div className="flex flex-col sm:items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">{apt.time}</span>
                            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest hidden sm:inline">Hora</span>
                          </div>
                        </div>

                        {/* Service description */}
                        <div className="min-w-0 space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${statusBg}`}>
                              {statusText}
                            </span>
                            <span className="text-sm text-neutral-400 font-mono flex items-center gap-1.5 bg-neutral-900/50 px-2.5 py-1 rounded-lg border border-neutral-800">
                              <Calendar className="h-4 w-4 text-[#eab308] shrink-0" /> {apt.date}
                            </span>
                          </div>
                          
                          <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                            {apt.serviceName}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="flex items-center gap-2.5 bg-neutral-900/40 border border-neutral-800/40 p-2.5 rounded-xl">
                              <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
                                <UserIcon className="h-5 w-5 shrink-0" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Profissional</p>
                                <p className="text-sm font-bold text-neutral-200 truncate">{apt.barberName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2.5 bg-neutral-900/40 border border-neutral-800/40 p-2.5 rounded-xl">
                              <div className="p-2 bg-neutral-800 rounded-lg text-[#eab308]">
                                <span className="font-mono font-bold text-sm">R$</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Valor do Serviço</p>
                                <p className="text-sm font-black text-[#eab308] font-mono">R$ {apt.servicePrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions and Status buttons */}
                      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-5 md:pt-0 border-t border-neutral-800/60 md:border-none w-full md:w-auto">
                        {/* Cancel Appointment button */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                                setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'cancelled' } : a));
                              }
                            }}
                            className="w-full sm:w-auto px-6 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/25 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-500/5 active:scale-95"
                          >
                            <Trash2 className="h-4.5 w-4.5 shrink-0" />
                            Cancelar Horário
                          </button>
                        )}
                        
                        {/* Review actions */}
                        {isCompleted && !hasReview && (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(apt)}
                            className="w-full sm:w-auto px-6 py-4 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#eab308]/15 active:scale-95"
                          >
                            <Star className="h-4.5 w-4.5 fill-current shrink-0" />
                            Avaliar Atendimento
                          </button>
                        )}
                        
                        {isCompleted && hasReview && (
                          <div className="inline-flex items-center justify-center gap-2 text-[#eab308] font-black text-xs bg-[#eab308]/10 px-5 py-3.5 rounded-xl border border-[#eab308]/20 select-none w-full sm:w-auto">
                            <Check className="h-4.5 w-4.5 stroke-[3] shrink-0" />
                            Atendimento Avaliado
                          </div>
                        )}

                        {/* Cancelled placeholder */}
                        {isCancelled && (
                          <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider italic text-center w-full sm:w-auto">
                            Horário Cancelado
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}

                {filteredAppointments.length === 0 && (
                  <div className="py-16 text-center border-2 border-dashed border-neutral-800 rounded-2xl bg-neutral-950/30">
                    <Calendar className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-400">Nenhum compromisso agendado para este dia.</p>
                    <p className="text-xs text-neutral-500 mt-1">Selecione outro dia ou clique em "Novo Agendamento" para marcar!</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : activeTab === 'reviews' ? (
          /* "Avaliações" Panel */
          <div className="space-y-8">
            
            {/* Stats / Header Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#161616] border border-neutral-800 p-6 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Total de Avaliações</p>
                <h4 className="text-4xl font-black text-white font-mono mt-1">{myReviews.length}</h4>
              </div>
              <div className="bg-[#161616] border border-neutral-800 p-6 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Média de Estrelas</p>
                <h4 className="text-4xl font-black text-[#eab308] font-mono mt-1 flex items-center gap-1.5">
                  {myReviews.length > 0 
                    ? (myReviews.reduce((sum, r) => sum + r.stars, 0) / myReviews.length).toFixed(1) 
                    : '0.0'}
                  <Star className="h-5 w-5 fill-[#eab308] text-[#eab308] shrink-0" />
                </h4>
              </div>
              <div className="bg-[#eab308]/5 border border-[#eab308]/15 p-6 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eab308]/15 flex items-center justify-center text-[#eab308] shrink-0">
                  <Smile className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">Sua opinião importa!</h5>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Avaliar o profissional nos ajuda a manter a Barbearia do Warley no padrão premium.</p>
                </div>
              </div>
            </div>

            {/* Grid of Reviews */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Meu Histórico de Avaliações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myReviews.map((rev) => {
                  const prof = users.find(u => u.id === rev.barberId);
                  return (
                    <div key={rev.id} className="bg-[#161616] border border-neutral-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        {/* Professional Information */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-neutral-850 shrink-0">
                              <img 
                                src={prof?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyfOr1CGt0zXoiz2wimjL3HVvuovk_QCQ786FkKyTnaKS7igANY2IILpFw4biui7pWvDp5NZhowMv1dThM5bX4U_smT5SY7SfUlUYhFlq_YyDS6fVCljqGgTVk5hArTDGt2Z7_-RO3wed9_0BTotkmVM_kuOAFJzGfO7LSZfU3yZwnK6GQZ3djhgMbp8jX5EC0naqgBa4_3sCtEZCXdr2DFeDSSqVjMIr8UzQl_fx1t1Eh7UAXTK2r71K9NgOYJettcXyQ1DzmG3-7'} 
                                alt={rev.barberName} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-xs">{rev.barberName}</h4>
                              <p className="text-[9px] text-[#eab308] font-mono uppercase tracking-wider">{prof?.specialty || 'Barbeiro Premium'}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] text-neutral-500 font-mono">{rev.date}</p>
                          </div>
                        </div>

                        {/* Stars Rating Display */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-4.5 w-4.5 shrink-0 ${
                                s <= rev.stars 
                                  ? 'fill-amber-500 text-amber-500' 
                                  : 'text-neutral-700'
                              }`} 
                            />
                          ))}
                          {rev.stars === 0 && (
                            <span className="text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 rounded font-black uppercase">0 Estrelas</span>
                          )}
                        </div>

                        {/* Comment Text */}
                        <p className="text-neutral-300 text-xs italic leading-relaxed bg-[#0e0e0e] p-3 rounded-xl border border-neutral-900">
                          {rev.comment ? `"${rev.comment}"` : <span className="text-neutral-500">Sem comentário em texto</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {myReviews.length === 0 && (
                  <div className="md:col-span-2 bg-[#161616] border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400 text-xs">
                    Nenhuma avaliação realizada ainda. Seus agendamentos concluídos aparecerão abaixo para você avaliar!
                  </div>
                )}
              </div>
            </div>

            {/* Pending evaluations section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Agendamentos Aguardando Sua Avaliação</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completedApts.filter(apt => !reviews.some(r => r.appointmentId === apt.id)).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="bg-[#161616] border border-neutral-800 hover:border-neutral-700 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 text-[#eab308] text-xs font-bold uppercase tracking-wider rounded-lg font-mono">
                          <Calendar className="h-3.5 w-3.5" />
                          {apt.date} às {apt.time}
                        </span>
                        <h4 className="text-lg font-black text-white truncate pt-1 leading-tight">{apt.serviceName}</h4>
                        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4 text-neutral-500 shrink-0" />
                          Profissional: <span className="text-neutral-200 font-semibold">{apt.barberName}</span>
                        </p>
                      </div>
                      
                      <div className="text-right shrink-0 bg-[#eab308]/5 border border-[#eab308]/10 px-2.5 py-1.5 rounded-xl">
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">Valor</p>
                        <p className="text-sm font-black font-mono text-[#eab308] mt-0.5">R$ {apt.servicePrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenReviewModal(apt)}
                      className="w-full py-3.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#eab308]/10 active:scale-95"
                    >
                      <Star className="h-4 w-4 fill-current shrink-0" />
                      Avaliar Atendimento Agora
                    </button>
                  </div>
                ))}
                
                {completedApts.filter(apt => !reviews.some(r => r.appointmentId === apt.id)).length === 0 && (
                  <div className="col-span-1 sm:col-span-2 bg-[#161616] border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400 text-xs">
                    Todos os seus agendamentos concluídos já foram avaliados! Excelente!
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Profile Edit Panel */
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-8 font-sans animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#eab308]/10 text-[#eab308] rounded-2xl border border-[#eab308]/15">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Configurações de Perfil
                    <span className="text-[10px] bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Dados e Foto</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Mantenha suas informações sempre atualizadas para agendamentos mais rápidos e controle de pontos.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Profile Picture Section */}
              <div className="space-y-4">
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Foto de Perfil
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-neutral-950/40 p-5 rounded-2xl border border-neutral-850">
                  {/* Left Column: Avatar Preview */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center space-y-4 border-r border-neutral-900/60 pr-0 md:pr-6">
                    {/* Current Avatar Preview */}
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-full border-4 border-[#eab308] p-0.5 overflow-hidden bg-neutral-900 shadow-xl shadow-black/45">
                        <img 
                          src={editAvatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQFM870Nqntq9wR3UcK8owdCkBFrweYg6dxYGiHkMZ_AEdRtSuR6XJpsrv0ikCboyWrEgCILPy554uXT9zEO_H6nfkd9WNUpqhKhqdSdKhbZyPYZTBipoG46WsqEy8w5hNkmrJmpuWcieTcnWHXftx_c1ZIVgbQmzY3jqRetlVI4KzPibKMpxgUbSY4tuCstfhyi42QHtT3IPBMjIfqOY18HEoC2Jued6JL81TBRx2dt3l5qcWNnkA3vuyAAiwZW7mBRIzUCaC-UWq'} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#eab308] text-black rounded-full border-2 border-[#161616] shadow-md">
                        <Camera className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-neutral-500 font-bold block uppercase tracking-wider">Preview Atual</span>
                    </div>
                  </div>

                  {/* Right Column: Upload Box and Alternatives */}
                  <div className="md:col-span-8 space-y-4 w-full">
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={handleClientDragOver}
                      onDragLeave={handleClientDragLeave}
                      onDrop={handleClientDrop}
                      onClick={() => document.getElementById('client-profile-file-input')?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                        isDraggingClient
                          ? 'border-[#eab308] bg-[#eab308]/5'
                          : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="file"
                        id="client-profile-file-input"
                        accept="image/*"
                        onChange={handleClientFileChange}
                        className="hidden"
                      />
                      <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${isDraggingClient ? 'text-[#eab308]' : 'text-neutral-500'}`} />
                      <p className="text-xs font-bold text-neutral-300">Arraste e solte sua foto aqui</p>
                      <p className="text-[10px] text-neutral-500 mt-1">ou clique para selecionar (Máx 2MB)</p>
                    </div>

                    {clientUploadError && (
                      <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-center">
                        {clientUploadError}
                      </p>
                    )}


                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full bg-[#1b1b1b] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Endereço de E-mail <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-[#1b1b1b] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Telefone de Contato <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Ex: (31) 98888-8888"
                      className="w-full bg-[#1b1b1b] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#eab308] font-mono"
                    />
                  </div>
                </div>

                {/* Birth Date */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <input
                      type="date"
                      value={editBirthDate}
                      onChange={(e) => setEditBirthDate(e.target.value)}
                      className="w-full bg-[#1b1b1b] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#eab308] font-mono"
                    />
                  </div>
                </div>

                {/* Password / Access Key */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                    Senha de Acesso (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Digite para alterar ou definir sua senha de acesso rápido"
                      className="w-full bg-[#1b1b1b] border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-[#eab308]"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 font-medium">Deixe em branco caso prefira fazer login direto usando apenas o seu telefone cadastrado.</p>
                </div>

              </div>

              {/* Save actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Voltar para Agenda
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#eab308]/15 cursor-pointer transform active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* MULTI-STEP SCHEDULING WIZARD MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-xl p-6 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Agendar Horário</h3>
                <p className="text-[11px] text-neutral-400 mt-1">Siga os passos simples para garantir seu atendimento</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#eab308] bg-[#eab308]/15 px-2.5 py-0.5 rounded">
                Passo {step} de 3
              </span>
            </div>

            {/* STEP 1: Select Service */}
            {step === 1 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Selecione o Serviço</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        selectedService?.id === service.id
                          ? 'border-[#eab308] bg-[#eab308]/5 active-ring'
                          : 'border-transparent bg-neutral-900 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-neutral-850 flex items-center justify-center text-[#eab308] shrink-0">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate">{service.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">R$ {service.price.toFixed(2)} • {service.durationMin} Min</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Select Professional */}
            {step === 2 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Selecione o Profissional</h4>
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      type="button"
                      onClick={() => setSelectedBarber(barber)}
                      className={`flex-shrink-0 w-36 bg-neutral-900 hover:bg-neutral-850 border p-3 rounded-xl text-center transition-all cursor-pointer relative ${
                        selectedBarber?.id === barber.id
                          ? 'border-[#eab308] active-ring'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden ring-2 ring-neutral-800 bg-neutral-800 flex items-center justify-center text-white font-extrabold text-lg">
                        {barber.avatarUrl ? (
                          <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                        ) : (
                          barber.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <h5 className="font-bold text-white text-xs truncate">{barber.name}</h5>
                      <p className="text-[9px] text-[#eab308] font-semibold mt-0.5">{barber.specialty || 'Barbeiro'}</p>
                      
                      {selectedBarber?.id === barber.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#eab308] rounded-full flex items-center justify-center">
                          <Check className="text-black h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Date & Time Picker */}
            {step === 3 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white">Data &amp; Horário</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Native Date Picker with Absences Warning */}
                  <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Selecione a Data</p>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-[#222] border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-1 focus:ring-[#eab308] outline-none font-mono font-bold"
                    />
                    
                    {selectedBarber && (selectedBarber.absences || []).includes(selectedDate) && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-xl font-bold leading-normal">
                        ⚠️ Atenção: {selectedBarber.name} não estará disponível nesta data devido a uma ausência/folga programada. Por favor, escolha outra data ou profissional.
                      </div>
                    )}
                  </div>

                  {/* Hour blocks */}
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold">Horários Disponíveis</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`p-2.5 rounded-xl border font-bold transition-all cursor-pointer ${
                            selectedTime === time
                              ? 'border-[#eab308] bg-[#eab308]/15 text-[#eab308] active-ring'
                              : 'border-transparent bg-neutral-900 text-neutral-400 hover:bg-neutral-850'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumo */}
                {selectedService && selectedBarber && (
                  <div className="p-4 bg-[#eab308]/5 border border-[#eab308]/15 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#eab308]">Resumo do Agendamento</p>
                      <p className="text-white text-sm font-bold mt-1">{selectedService.name} com {selectedBarber.name}</p>
                      <p className="text-neutral-400 text-xs mt-0.5">Data: {selectedDate} às {selectedTime}</p>
                    </div>
                    <div className="text-right font-mono text-[#eab308] font-black text-sm">
                      {(() => {
                        const config = (selectedBarber.barberServices || []).find(s => s.serviceId === selectedService.id);
                        const price = config && config.customPrice !== undefined ? config.customPrice : selectedService.price;
                        return `R$ ${price.toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-neutral-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={step === 1 ? !selectedService : !selectedBarber}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] disabled:opacity-40 disabled:hover:bg-[#eab308] text-black rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  Avançar
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={selectedBarber ? (selectedBarber.absences || []).includes(selectedDate) : false}
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg text-xs font-black cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REVIEW / EVALUATION MODAL */}
      {showReviewModal && selectedAptToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Avaliar Atendimento</h3>
                <p className="text-[11px] text-neutral-400 mt-1">Como foi o seu serviço com {selectedAptToReview.barberName}?</p>
              </div>
              <button 
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedAptToReview(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-6">
              
              {/* Selected Service and Professional info */}
              <div className="p-4 bg-neutral-900 rounded-2xl border border-neutral-850 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center text-white font-bold text-xs">
                  {users.find(u => u.id === selectedAptToReview.barberId)?.avatarUrl ? (
                    <img 
                      src={users.find(u => u.id === selectedAptToReview.barberId)?.avatarUrl} 
                      alt={selectedAptToReview.barberName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    selectedAptToReview.barberName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{selectedAptToReview.barberName}</p>
                  <p className="text-[10px] text-neutral-400">{selectedAptToReview.serviceName} • {selectedAptToReview.date}</p>
                </div>
              </div>

              {/* Star Rating Selection */}
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Quantidade de Estrelas</label>
                <div className="flex justify-center items-center gap-2 mt-2">
                  {[0, 1, 2, 3, 4, 5].map((starNum) => (
                    <button
                      key={starNum}
                      type="button"
                      onClick={() => setRatingStars(starNum)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      {starNum === 0 ? (
                        <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-md border uppercase shrink-0 ${
                          ratingStars === 0 
                            ? 'bg-rose-500/10 border-rose-500 text-rose-500 font-black' 
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 font-semibold'
                        }`}>
                          0 Estrelas
                        </span>
                      ) : (
                        <Star 
                          className={`h-8 w-8 shrink-0 transition-colors ${
                            starNum <= ratingStars 
                              ? 'fill-amber-500 text-amber-500' 
                              : 'text-neutral-700'
                          }`} 
                        />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-neutral-500 mt-1">
                  {ratingStars === 0 && 'Fraco (0/5)'}
                  {ratingStars === 1 && 'Ruim (1/5)'}
                  {ratingStars === 2 && 'Regular (2/5)'}
                  {ratingStars === 3 && 'Bom (3/5)'}
                  {ratingStars === 4 && 'Muito Bom (4/5)'}
                  {ratingStars === 5 && 'Excelente (5/5)'}
                </p>
              </div>

              {/* Comment Text Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Sua Avaliação (Texto)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Escreva como foi o atendimento, o resultado do corte ou sua sugestão..."
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#eab308] resize-none"
                />
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedAptToReview(null);
                }}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={ratingStars < 0 || ratingStars > 5}
                className="px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] disabled:opacity-40 text-black font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Enviar Avaliação
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
