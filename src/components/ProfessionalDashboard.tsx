import React, { useState } from 'react';
import { 
  LogOut, Star, Scissors, Check, Clock, User as UserIcon, Calendar, Award, CheckCircle2, Settings, Upload, Image as ImageIcon, Phone, Trash2, Plus, Minus, ShoppingBag, X
} from 'lucide-react';
import { User, Appointment, AppointmentStatus, Service, Review, Product } from '../types';

interface ProfessionalDashboardProps {
  barber: User;
  onLogout: () => void;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  reviews: Review[];
  services: Service[];
  users: User[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function ProfessionalDashboard({
  barber,
  onLogout,
  appointments,
  setAppointments,
  setUsers,
  reviews,
  services,
  users,
  products,
  setProducts
}: ProfessionalDashboardProps) {
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Dinheiro' | 'Cartão'>('PIX');

  // Comanda Products states
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [currentSelectedProductId, setCurrentSelectedProductId] = useState<string>('');
  const [productError, setProductError] = useState('');

  // New Appointment States
  const [isNewAptModalOpen, setIsNewAptModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedAptDate, setSelectedAptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedAptTime, setSelectedAptTime] = useState('09:00');
  const [aptError, setAptError] = useState('');

  // Profile Settings States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState(barber.name);
  const [editPhone, setEditPhone] = useState(barber.phone);
  const [editSpecialty, setEditSpecialty] = useState(barber.specialty || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(barber.avatarUrl || '');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Absence states
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [newAbsenceDate, setNewAbsenceDate] = useState('');

  const openSettings = () => {
    setEditName(barber.name);
    setEditPhone(barber.phone);
    setEditSpecialty(barber.specialty || '');
    setEditAvatarUrl(barber.avatarUrl || '');
    setUploadError('');
    setIsSettingsOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setUploadError('Por favor, informe seu nome.');
      return;
    }
    if (!editPhone.trim()) {
      setUploadError('Por favor, informe seu telefone.');
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === barber.id) {
        return {
          ...u,
          name: editName,
          phone: editPhone,
          specialty: barber.role === 'owner' ? editSpecialty : u.specialty,
          avatarUrl: editAvatarUrl
        };
      }
      return u;
    }));

    setIsSettingsOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.src = event.target.result as string;
        img.onload = () => {
          // Create canvas to resize and compress image to an avatar size (e.g., 200x200)
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
            // Compress as JPEG with 0.7 quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setEditAvatarUrl(compressedBase64);
          } else {
            setEditAvatarUrl(event.target?.result as string);
          }
        };
        img.onerror = () => {
          setUploadError('Erro ao processar imagem.');
        };
      }
    };
    reader.onerror = () => {
      setUploadError('Erro ao ler a imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Filter appointments specifically assigned to this barber
  const myAppointments = appointments.filter(a => a.barberId === barber.id);
  const todayStr = new Date().toISOString().split('T')[0];

  const todayMyApts = myAppointments.filter(a => a.date === todayStr);
  const pendingApts = todayMyApts.filter(a => a.status === 'pending' || a.status === 'active');
  const completedAptsToday = todayMyApts.filter(a => a.status === 'completed');

  // Calculate personal metrics: personal commission is customized per barber
  const myTotalRevenue = completedAptsToday.reduce((sum, current) => sum + current.servicePrice, 0);
  const commRate = barber.commissionPercent !== undefined ? barber.commissionPercent : 50;
  const myCommission = myTotalRevenue * (commRate / 100);

  const updateStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleFinishAptClick = (apt: Appointment) => {
    setCompletingApt(apt);
    setPaymentMethod('PIX');
    setSelectedProducts([]);
    setProductError('');
    // select first product with stock
    const firstProd = products.find(p => p.stock > 0);
    setCurrentSelectedProductId(firstProd?.id || '');
  };

  const handleAddProductToComanda = (productId: string) => {
    setProductError('');
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      setProductError('Produto sem estoque disponível.');
      return;
    }

    const existing = selectedProducts.find(sp => sp.id === productId);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= product.stock) {
      setProductError(`Estoque limite atingido para ${product.name} (${product.stock} disponíveis).`);
      return;
    }

    if (existing) {
      setSelectedProducts(prev => prev.map(sp => sp.id === productId ? { ...sp, quantity: sp.quantity + 1 } : sp));
    } else {
      setSelectedProducts(prev => [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const handleDecreaseProductQty = (productId: string) => {
    setProductError('');
    setSelectedProducts(prev => prev.map(sp => {
      if (sp.id === productId) {
        return { ...sp, quantity: sp.quantity - 1 };
      }
      return sp;
    }).filter(sp => sp.quantity > 0));
  };

  const handleRemoveProductFromComanda = (productId: string) => {
    setProductError('');
    setSelectedProducts(prev => prev.filter(sp => sp.id !== productId));
  };

  const confirmFinishApt = () => {
    if (!completingApt) return;

    const productsTotal = selectedProducts.reduce((sum, sp) => sum + sp.price * sp.quantity, 0);
    const finalTotal = completingApt.servicePrice + productsTotal;

    // Deduct stock
    setProducts(prev => prev.map(p => {
      const selected = selectedProducts.find(sp => sp.id === p.id);
      if (selected) {
        return { ...p, stock: Math.max(0, p.stock - selected.quantity) };
      }
      return p;
    }));

    setAppointments(prev => prev.map(a => a.id === completingApt.id ? {
      ...a,
      status: 'completed',
      paymentMethod: paymentMethod,
      products: selectedProducts,
      totalPrice: finalTotal
    } : a));

    // Award loyalty points to the customer (10 points per R$ spent)
    setUsers(prev => prev.map(u => {
      if (u.id === completingApt.clientId) {
        const currentPoints = u.points || 0;
        const pointsEarned = Math.round(finalTotal * 10);
        return { ...u, points: currentPoints + pointsEarned };
      }
      return u;
    }));

    setCompletingApt(null);
  };

  const openNewAptModal = () => {
    setSelectedClientId('new');
    setNewClientName('');
    setNewClientPhone('');
    setSelectedServiceId(services[0]?.id || '');
    setSelectedAptDate(new Date().toISOString().split('T')[0]);
    setSelectedAptTime('09:00');
    setAptError('');
    setIsNewAptModalOpen(true);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAptError('');

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) {
      setAptError('Selecione um serviço válido.');
      return;
    }

    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientPhone = '';

    if (selectedClientId === 'new') {
      if (!newClientName.trim()) {
        setAptError('Por favor, informe o nome do cliente.');
        return;
      }
      if (!newClientPhone.trim()) {
        setAptError('Por favor, informe o telefone do cliente.');
        return;
      }
      finalClientId = 'client-' + Date.now();
      finalClientName = newClientName.trim();
      finalClientPhone = newClientPhone.trim();

      const newClientUser: User = {
        id: finalClientId,
        name: finalClientName,
        phone: finalClientPhone,
        email: `${finalClientName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')}@example.com`,
        role: 'client',
        points: 0
      };
      setUsers(prev => [...prev, newClientUser]);
    } else {
      const client = users.find(u => u.id === selectedClientId);
      if (!client) {
        setAptError('Cliente selecionado não encontrado.');
        return;
      }
      finalClientName = client.name;
      finalClientPhone = client.phone;
    }

    if (!selectedAptDate) {
      setAptError('Por favor, selecione uma data.');
      return;
    }

    if (!selectedAptTime) {
      setAptError('Por favor, selecione um horário.');
      return;
    }

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      clientId: finalClientId,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      date: selectedAptDate,
      time: selectedAptTime,
      status: 'pending'
    };

    setAppointments(prev => [...prev, newApt]);
    setIsNewAptModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] pb-12 select-none">
      
      {/* Top App Bar */}
      <header className="h-16 bg-[#0e0e0e] border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#eab308]/20 flex items-center justify-center text-[#eab308]">
            <Scissors className="h-4.5 w-4.5" />
          </div>
          <h1 className="text-sm font-extrabold tracking-widest text-[#eab308] uppercase font-mono">
            Painel do Profissional
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openSettings}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs font-bold"
            title="Editar Perfil"
          >
            <Settings className="h-4 w-4 animate-hover" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs font-bold"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#161616] border border-neutral-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 group">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#eab308]/20">
                <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={openSettings}
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
                title="Editar foto de perfil"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
            <div>
              <span className="px-2 py-0.5 bg-[#eab308]/10 text-[#eab308] text-[9px] font-black tracking-widest uppercase rounded">
                {barber.specialty || 'Profissional'}
              </span>
              <h2 className="text-xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                Bem-vindo, {barber.name}!
              </h2>
              <p className="text-neutral-400 text-xs mt-0.5">Gerencie seus atendimentos e comissões do dia.</p>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-start md:items-end gap-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 text-xs bg-[#222] border border-neutral-800 px-3 py-1.5 rounded-xl text-[#eab308] font-bold font-mono">
              <Star className="h-4 w-4 fill-[#eab308] text-[#eab308]" />
              <span>Avaliação: {barber.rating || '5.0'} / 5.0</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAbsenceModalOpen(true)}
                className="px-3 py-1.5 bg-rose-950/25 hover:bg-rose-900/35 border border-rose-900/50 text-xs text-rose-400 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Ausências / Folgas</span>
              </button>
              <button
                onClick={openSettings}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-neutral-400" />
                <span>Editar Perfil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Performance stats (NO global financial info shown) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Cortes Hoje</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">
              {completedAptsToday.length} finalizados
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1">Sua cota de atendimentos concluídos hoje</p>
          </div>

          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Comissão Estimada ({commRate}%)</p>
            <h3 className="text-2xl font-black text-[#eab308] mt-1 font-mono">
              R$ {myCommission.toFixed(2)}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1">Sua participação garantida sobre os cortes de hoje</p>
          </div>

          <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5">
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Próximo Horário</p>
            <h3 className="text-2xl font-black text-white mt-1 font-mono">
              {pendingApts.length > 0 ? pendingApts[0].time : 'Sem filas'}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-1">
              {pendingApts.length > 0 ? `Próximo: ${pendingApts[0].clientName}` : 'Tudo em dia por hoje!'}
            </p>
          </div>
        </div>

        {/* Current appointments timeline */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-900/60">
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#eab308]" />
              Atendimentos de Hoje ({todayMyApts.length})
            </h3>
            <button
              onClick={openNewAptModal}
              className="px-3.5 py-1.5 bg-[#eab308] hover:bg-[#ca8a04] active:scale-95 text-black rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" />
              + Novo Agendamento
            </button>
          </div>

          <div className="divide-y divide-neutral-900 space-y-4">
            {pendingApts.map((apt) => (
              <div key={apt.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-mono font-bold text-[#eab308] text-sm shrink-0 border border-neutral-700/50">
                    {apt.time}
                  </div>
                  <div>
                    <h4 className="font-bold text-white tracking-tight text-sm">{apt.serviceName}</h4>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <UserIcon className="h-3.5 w-3.5 shrink-0" />
                      Cliente: {apt.clientName} | Cel: {apt.clientPhone}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        apt.status === 'active' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {apt.status === 'active' ? 'Em Atendimento' : 'Agendado'}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#eab308]">
                        R$ {apt.servicePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {apt.status === 'pending' ? (
                    <button
                      onClick={() => updateStatus(apt.id, 'active')}
                      className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold border border-neutral-800 cursor-pointer"
                    >
                      Iniciar Atendimento
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFinishAptClick(apt)}
                      className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      Finalizar Atendimento
                    </button>
                  )}
                </div>
              </div>
            ))}

            {pendingApts.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">Nenhum atendimento pendente para hoje. Bom trabalho!</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed list */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Serviços Finalizados Hoje</h3>
          
          <div className="space-y-2">
            {completedAptsToday.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs">
                <div>
                  <p className="font-bold text-white">{apt.serviceName}</p>
                  <p className="text-[10px] text-neutral-400">Cliente {apt.clientName} • Concluído às {apt.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-[#eab308]">R$ {apt.servicePrice.toFixed(2)}</p>
                  <p className="text-[9px] text-neutral-500 font-bold uppercase">Pago via {apt.paymentMethod || 'PIX'}</p>
                </div>
              </div>
            ))}
            {completedAptsToday.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">Nenhum atendimento finalizado hoje ainda.</p>
            )}
          </div>
        </div>

        {/* Minhas Avaliações */}
        <div className="bg-[#161616] border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900/60">
            <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <Star className="h-4.5 w-4.5 text-[#eab308] fill-[#eab308]" />
              Minhas Avaliações ({reviews.filter(r => r.barberId === barber.id).length})
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[#eab308] font-bold bg-[#eab308]/10 px-2.5 py-1 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-[#eab308] text-[#eab308]" />
              <span>{barber.rating || '5.0'} / 5.0</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {(() => {
              const barberReviews = reviews.filter(r => r.barberId === barber.id);
              if (barberReviews.length === 0) {
                return (
                  <div className="text-center py-8 text-neutral-500">
                    <Star className="h-8 w-8 text-neutral-700 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Nenhum comentário ou avaliação detalhada recebida ainda.</p>
                  </div>
                );
              }

              return barberReviews.map((rev) => {
                const clientUser = users.find(u => u.id === rev.clientId);
                const avatarToUse = clientUser?.avatarUrl;

                return (
                  <div key={rev.id} className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-white font-black text-[10px] overflow-hidden">
                          {avatarToUse ? (
                            <img src={avatarToUse} alt={rev.clientName} className="w-full h-full object-cover" />
                          ) : (
                            rev.clientName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{rev.clientName}</p>
                          <p className="text-[9px] text-neutral-500 font-bold font-mono">{rev.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 bg-[#eab308]/10 px-2 py-0.5 rounded-lg">
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
        </div>

      </main>

      {/* Complete service payment modal */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <h3 className="text-lg font-bold text-white tracking-tight mb-2 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#eab308]" />
              Concluir Atendimento
            </h3>
            <p className="text-xs text-neutral-400 mb-4">Gerencie a comanda, adicione produtos opcionais e escolha a forma de pagamento.</p>

            <div className="p-3 bg-neutral-900 rounded-xl text-xs font-medium space-y-1.5 border border-neutral-800 mb-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Serviço:</span>
                <span className="text-white font-bold">{completingApt.serviceName} (R$ {completingApt.servicePrice.toFixed(2)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cliente:</span>
                <span className="text-white font-bold">{completingApt.clientName}</span>
              </div>
              {selectedProducts.length > 0 && (
                <div className="flex justify-between text-neutral-400 border-t border-neutral-800/40 pt-1.5">
                  <span>Produtos ({selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0)}):</span>
                  <span>R$ {selectedProducts.reduce((sum, sp) => sum + sp.price * sp.quantity, 0).toFixed(2)}</span>
                </div>
              )}
              {(() => {
                const productsTotal = selectedProducts.reduce((sum, sp) => sum + sp.price * sp.quantity, 0);
                const finalTotal = completingApt.servicePrice + productsTotal;
                return (
                  <div className="flex justify-between pt-1.5 border-t border-neutral-800 font-mono text-[#eab308]">
                    <span>Total:</span>
                    <span className="font-bold text-sm">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                );
              })()}
            </div>

            {/* Seção de Inclusão de Produtos */}
            <div className="space-y-2 border-t border-neutral-800/80 pt-4 mb-4">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Incluir Produtos na Comanda
              </label>
              <div className="flex gap-2">
                <select
                  value={currentSelectedProductId}
                  onChange={(e) => setCurrentSelectedProductId(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                >
                  <option value="" disabled>Selecione um produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                      {p.name} - R$ {p.price.toFixed(2)} {p.stock <= 0 ? '(Sem Estoque)' : `(${p.stock} un)`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => currentSelectedProductId && handleAddProductToComanda(currentSelectedProductId)}
                  disabled={!currentSelectedProductId}
                  className="p-2.5 bg-[#eab308] hover:bg-[#ca8a04] disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Product error message if any */}
              {productError && (
                <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/15">
                  {productError}
                </p>
              )}

              {/* List of added products */}
              {selectedProducts.length > 0 ? (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 mt-2 bg-neutral-900/50 p-2 rounded-xl border border-neutral-800/60 scrollbar-thin">
                  {selectedProducts.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between text-xs bg-[#121212] border border-neutral-800/50 p-2 rounded-lg">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-white truncate text-xs">{sp.name}</p>
                        <p className="text-[10px] text-neutral-500 font-bold font-mono">
                          R$ {sp.price.toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700/50">
                          <button
                            type="button"
                            onClick={() => handleDecreaseProductQty(sp.id)}
                            className="p-1 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-1.5 text-xs font-bold font-mono text-white">
                            {sp.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddProductToComanda(sp.id)}
                            className="p-1 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromComanda(sp.id)}
                          className="p-1 text-neutral-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 italic text-center py-2.5 bg-neutral-900/20 rounded-xl border border-dashed border-neutral-800">
                  Nenhum produto adicionado à comanda ainda.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-neutral-400 uppercase">Método de Recebimento</label>
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
                onClick={confirmFinishApt}
                className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Concluir Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative my-8">
            <h3 className="text-lg font-black text-white tracking-tight mb-2">Editar Perfil Profissional</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Altere seus dados de exibição e foto de perfil. As mudanças serão salvas no banco de dados.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Profile Photo Upload/Drag & Drop */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Foto de Perfil
                </label>
                
                <div className="flex items-center gap-4 p-3 bg-neutral-900 rounded-2xl border border-neutral-800">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-neutral-800 ring-2 ring-[#eab308]/30">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500">
                        <UserIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">Visualização</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Clique abaixo ou arraste uma foto para atualizar</p>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#eab308] bg-[#eab308]/5'
                      : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                  onClick={() => document.getElementById('profile-file-input')?.click()}
                >
                  <input
                    type="file"
                    id="profile-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className={`h-6 w-6 mx-auto mb-2 transition-colors ${isDragging ? 'text-[#eab308]' : 'text-neutral-500'}`} />
                  <p className="text-xs font-bold text-neutral-300">Arraste uma foto aqui</p>
                  <p className="text-[10px] text-neutral-500 mt-1">ou clique para selecionar do dispositivo (Máx 2MB)</p>
                </div>


              </div>

              {uploadError && (
                <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {uploadError}
                </p>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="edit-profile-name">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="edit-profile-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="block w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="edit-profile-phone">
                  Telefone / Celular
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="edit-profile-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(67) 99999-9999"
                    required
                    className="block w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                  />
                </div>
              </div>

              {/* Specialty */}
              {barber.role === 'owner' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="edit-profile-specialty">
                    Especialidade / Cargo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                      <Award className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="edit-profile-specialty"
                      value={editSpecialty}
                      onChange={(e) => setEditSpecialty(e.target.value)}
                      placeholder="Ex: Barbeiro Sênior, Especialista"
                      className="block w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Salvar Mudanças
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Agendamento */}
      {isNewAptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative my-8">
            <h3 className="text-lg font-black text-white tracking-tight mb-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#eab308]" />
              Novo Agendamento Manual
            </h3>
            <p className="text-xs text-neutral-400 mb-5">
              Crie um novo agendamento para si mesmo. Escolha um cliente cadastrado ou preencha os dados de um novo cliente.
            </p>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Client type toggler */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Tipo de Cliente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClientId('new')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedClientId === 'new'
                        ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Novo Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const firstClient = users.find(u => u.role === 'client');
                      setSelectedClientId(firstClient?.id || 'new');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedClientId !== 'new'
                        ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308]'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Cliente Cadastrado
                  </button>
                </div>
              </div>

              {selectedClientId === 'new' ? (
                <>
                  {/* Name of new client */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="new-client-name">
                      Nome do Cliente
                    </label>
                    <input
                      type="text"
                      id="new-client-name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Nome completo do cliente"
                      required
                      className="block w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                    />
                  </div>

                  {/* Phone of new client */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="new-client-phone">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      id="new-client-phone"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="(67) 99999-9999"
                      required
                      className="block w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                    />
                  </div>
                </>
              ) : (
                /* Select existing client */
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="existing-client-select">
                    Selecionar Cliente
                  </label>
                  <select
                    id="existing-client-select"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="block w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                  >
                    {users.filter(u => u.role === 'client').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.phone})
                      </option>
                    ))}
                    {users.filter(u => u.role === 'client').length === 0 && (
                      <option value="new">Nenhum cliente cadastrado - Cadastre um novo</option>
                    )}
                  </select>
                </div>
              )}

              {/* Service */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="service-select">
                  Serviço
                </label>
                <select
                  id="service-select"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="block w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="apt-date-select">
                    Data
                  </label>
                  <input
                    type="date"
                    id="apt-date-select"
                    value={selectedAptDate}
                    onChange={(e) => setSelectedAptDate(e.target.value)}
                    required
                    className="block w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="apt-time-select">
                    Horário
                  </label>
                  <select
                    id="apt-time-select"
                    value={selectedAptTime}
                    onChange={(e) => setSelectedAptTime(e.target.value)}
                    className="block w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl py-2.5 px-3 text-xs focus:ring-1 focus:ring-[#eab308] focus:border-[#eab308]"
                  >
                    {[
                      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
                      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
                      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
                      "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
                    ].map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {aptError && (
                <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {aptError}
                </p>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewAptModalOpen(false)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Agendar
                </button>
              </div>
            </form>
          </div>
         </div>
      )}

      {/* MODAL: Absence Management */}
      {isAbsenceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161616] border border-neutral-800 rounded-3xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsAbsenceModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-white hover:bg-neutral-850 rounded-xl transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              <span>Marcar Folgas e Ausências</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Marque os dias em que você não estará disponível na barbearia. Os clientes não poderão agendar horários com você nessas datas.
            </p>

            {/* Add Absence Form */}
            <div className="mt-5 p-4 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Agendar Nova Ausência</h4>
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
                    const cur = users.find(u => u.id === barber.id) || barber;
                    const exists = (cur.absences || []).includes(newAbsenceDate);
                    if (exists) return;
                    const updatedAbsences = [...(cur.absences || []), newAbsenceDate].sort();
                    
                    // Update user local state & sync
                    setUsers(prev => prev.map(u => u.id === barber.id ? {
                      ...u,
                      absences: updatedAbsences
                    } : u));
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
              <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider">Minhas Ausências Agendadas</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(() => {
                  const cur = users.find(u => u.id === barber.id) || barber;
                  return (!cur.absences || cur.absences.length === 0) ? (
                    <p className="text-xs text-neutral-500 italic py-3 text-center">Nenhuma ausência cadastrada. Você está disponível todos os dias!</p>
                  ) : (
                    cur.absences.map(dateStr => {
                      const [year, month, day] = dateStr.split('-');
                      const formattedDate = `${day}/${month}/${year}`;
                      return (
                        <div key={dateStr} className="flex items-center justify-between p-2.5 bg-neutral-900/40 border border-neutral-850 rounded-xl">
                          <span className="text-xs text-white font-mono font-bold">{formattedDate}</span>
                          <button
                            onClick={() => {
                              const updatedAbsences = (cur.absences || []).filter(d => d !== dateStr);
                              
                              // Update user local state & sync
                              setUsers(prev => prev.map(u => u.id === barber.id ? {
                                ...u,
                                absences: updatedAbsences
                              } : u));
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                            title="Remover Ausência"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-neutral-850">
              <button
                onClick={() => setIsAbsenceModalOpen(false)}
                className="px-5 py-2 bg-[#eab308] hover:bg-[#ca8a04] text-black rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
