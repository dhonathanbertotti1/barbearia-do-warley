import React, { useState, useEffect } from 'react';
import { 
  Database, AlertTriangle, CheckCircle2, Copy, Check, ExternalLink, RefreshCw, HelpCircle, X, Terminal
} from 'lucide-react';
import { User, Service, Appointment, Review, Product } from './types';
import { INITIAL_USERS, INITIAL_SERVICES, INITIAL_APPOINTMENTS, INITIAL_REVIEWS } from './data';
import Login from './components/Login';
import OwnerDashboard from './components/OwnerDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import ClientDashboard from './components/ClientDashboard';
import BarberLogo from './components/BarberLogo';

const SCHEMA_SQL = `-- SQL de Inicialização do Supabase para Barbearia do Warley

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'professional', 'client')),
  avatar_url TEXT,
  specialty TEXT,
  rating NUMERIC DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  password TEXT,
  commission_percent INTEGER DEFAULT 50,
  barber_services TEXT,
  absences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_min INTEGER NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  popular BOOLEAN DEFAULT false,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_price NUMERIC NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  barber_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barber_name TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 0 AND stars <= 5),
  comment TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;`;export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('barbearia_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error reading currentUser from localStorage:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    supabaseConfigured: boolean;
    supabaseConnected: boolean;
    tablesCreated: boolean;
    error: string | null;
  }>({
    supabaseConfigured: false,
    supabaseConnected: false,
    tablesCreated: false,
    error: null
  });

   const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('barbearia_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'p-1', name: 'Pomada Modeladora Matte', price: 45.00, stock: 15 },
      { id: 'p-2', name: 'Óleo para Barba Premium', price: 35.00, stock: 10 },
      { id: 'p-3', name: 'Shampoo Mentolado Cabelo/Barba', price: 40.00, stock: 8 },
      { id: 'p-4', name: 'Gel de Barbear Hidratante', price: 25.00, stock: 12 },
    ];
  });

  const handleSetProducts = (value: React.SetStateAction<Product[]>) => {
    setProducts(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem('barbearia_products', JSON.stringify(next));
      return next;
    });
  };

  // Sync initial data and database status from backend on mount
  const loadDatabaseState = async () => {
    // Migration check for stale local storage structure (to load newly added team members and reviews)
    try {
      const localUsersSaved = localStorage.getItem('barbearia_local_users');
      if (localUsersSaved) {
        const parsed = JSON.parse(localUsersSaved);
        const hasKauan = Array.isArray(parsed) && parsed.some((u: any) => u.id === 'kauan');
        if (!hasKauan) {
          console.log("Migrating stale local storage to updated team members schema.");
          localStorage.removeItem('barbearia_local_users');
          localStorage.removeItem('barbearia_local_appointments');
          localStorage.removeItem('barbearia_local_reviews');
          localStorage.removeItem('barbearia_products');
        }
      }
    } catch (e) {
      console.error("Migration check error:", e);
    }

    setLoading(true);
    setIsDataLoaded(false);
    setProgress(0);
    try {
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      setDbStatus(statusData);

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.data) {
        if (!statusData.supabaseConfigured) {
          const localUsersSaved = localStorage.getItem('barbearia_local_users');
          if (localUsersSaved) {
            setUsers(JSON.parse(localUsersSaved));
          } else {
            setUsers(usersData.data);
          }
        } else {
          setUsers(usersData.data);
        }
      }

      const servicesRes = await fetch('/api/services');
      const servicesData = await servicesRes.json();
      if (servicesData.data) {
        if (!statusData.supabaseConfigured) {
          const localServicesSaved = localStorage.getItem('barbearia_local_services');
          if (localServicesSaved) {
            setServices(JSON.parse(localServicesSaved));
          } else {
            setServices(servicesData.data);
          }
        } else {
          setServices(servicesData.data);
        }
      }

      const appointmentsRes = await fetch('/api/appointments');
      const appointmentsData = await appointmentsRes.json();
      if (appointmentsData.data) {
        if (!statusData.supabaseConfigured) {
          const localAptsSaved = localStorage.getItem('barbearia_local_appointments');
          if (localAptsSaved) {
            setAppointments(JSON.parse(localAptsSaved));
          } else {
            setAppointments(appointmentsData.data);
          }
        } else {
          setAppointments(appointmentsData.data);
        }
      }

      const reviewsRes = await fetch('/api/reviews');
      const reviewsData = await reviewsRes.json();
      if (reviewsData.data) {
        if (!statusData.supabaseConfigured) {
          const localReviewsSaved = localStorage.getItem('barbearia_local_reviews');
          if (localReviewsSaved) {
            setReviews(JSON.parse(localReviewsSaved));
          } else {
            setReviews(reviewsData.data);
          }
        } else {
          setReviews(reviewsData.data);
        }
      }
    } catch (e) {
      console.error("API error, falling back to Local/Memory storage:", e);
      // fallback from localStorage
      const localUsersSaved = localStorage.getItem('barbearia_local_users');
      if (localUsersSaved) setUsers(JSON.parse(localUsersSaved));
      const localServicesSaved = localStorage.getItem('barbearia_local_services');
      if (localServicesSaved) setServices(JSON.parse(localServicesSaved));
      const localAptsSaved = localStorage.getItem('barbearia_local_appointments');
      if (localAptsSaved) setAppointments(JSON.parse(localAptsSaved));
      const localReviewsSaved = localStorage.getItem('barbearia_local_reviews');
      if (localReviewsSaved) setReviews(JSON.parse(localReviewsSaved));
    } finally {
      setIsDataLoaded(true);
    }
  };

  // Smoothly increment the progress bar from 0% to 100%
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          // Hold the progress bar if the API takes longer than expected
          if (!isDataLoaded && prev >= 88) {
            return prev;
          }
          // Increment progress naturally
          const step = Math.floor(Math.random() * 8) + 4;
          const next = prev + step;
          return next >= 100 ? 100 : next;
        });
      }, 70);
    }
    return () => clearInterval(timer);
  }, [loading, isDataLoaded]);

  // Complete loading once progress and server data are fully synced
  useEffect(() => {
    if (progress === 100 && isDataLoaded) {
      const delay = setTimeout(() => {
        setLoading(false);
      }, 350);
      return () => clearTimeout(delay);
    }
  }, [progress, isDataLoaded]);

  useEffect(() => {
    loadDatabaseState();
  }, []);

  // Sync user profile state in real-time
  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
        localStorage.setItem('barbearia_current_user', JSON.stringify(updated));
      }
    }
  }, [users, currentUser]);

  // Intercept state setters to push updates server-side (sync with Supabase)
  const handleSetUsers = (value: React.SetStateAction<User[]>) => {
    setUsers(prev => {
      const next = (typeof value === 'function' ? (value as Function)(prev) : value) as User[];
      
      // Save locally immediately to preserve photos and local changes
      localStorage.setItem('barbearia_local_users', JSON.stringify(next));

      const prevMap = new Map<string, User>(prev.map(u => [u.id, u]));
      const nextMap = new Map<string, User>(next.map(u => [u.id, u]));

      next.forEach((user: User) => {
        const p = prevMap.get(user.id);
        if (
          !p ||
          p.points !== user.points ||
          p.specialty !== user.specialty ||
          p.rating !== user.rating ||
          p.name !== user.name ||
          p.email !== user.email ||
          p.phone !== user.phone ||
          p.role !== user.role ||
          p.avatarUrl !== user.avatarUrl ||
          p.commissionPercent !== user.commissionPercent ||
          p.password !== user.password ||
          JSON.stringify(p.barberServices) !== JSON.stringify(user.barberServices) ||
          JSON.stringify(p.absences) !== JSON.stringify(user.absences)
        ) {
          setSyncing(true);
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error syncing user:", err);
            setSyncing(false);
          });
        }
      });

      // Detect and propagate user deletions to Supabase
      prev.forEach((user: User) => {
        if (!nextMap.has(user.id)) {
          setSyncing(true);
          fetch(`/api/users/${user.id}`, {
            method: 'DELETE'
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error deleting user:", err);
            setSyncing(false);
          });

          // Keep appointments and reviews in perfect sync locally
          setTimeout(() => {
            setAppointments(prevApts => prevApts.filter(a => a.barberId !== user.id && a.clientId !== user.id));
            setReviews(prevReviews => prevReviews.filter(r => r.barberId !== user.id && r.clientId !== user.id));
          }, 0);
        }
      });

      return next;
    });
  };

  const handleSetServices = (value: React.SetStateAction<Service[]>) => {
    setServices(prev => {
      const next = (typeof value === 'function' ? (value as Function)(prev) : value) as Service[];
      
      // Save locally immediately
      localStorage.setItem('barbearia_local_services', JSON.stringify(next));

      const prevMap = new Map<string, Service>(prev.map(s => [s.id, s]));
      const nextMap = new Map<string, Service>(next.map(s => [s.id, s]));
      
      next.forEach((service: Service) => {
        const p = prevMap.get(service.id);
        if (!p || p.price !== service.price || p.name !== service.name || p.durationMin !== service.durationMin || p.description !== service.description || p.category !== service.category || p.popular !== service.popular || p.iconName !== service.iconName) {
          setSyncing(true);
          fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error syncing service:", err);
            setSyncing(false);
          });
        }
      });
      
      prev.forEach((service: Service) => {
        if (!nextMap.has(service.id)) {
          setSyncing(true);
          fetch(`/api/services/${service.id}`, {
            method: 'DELETE'
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error deleting service:", err);
            setSyncing(false);
          });
        }
      });
      
      return next;
    });
  };

  const handleSetAppointments = (value: React.SetStateAction<Appointment[]>) => {
    setAppointments(prev => {
      const next = (typeof value === 'function' ? (value as Function)(prev) : value) as Appointment[];
      
      // Save locally immediately
      localStorage.setItem('barbearia_local_appointments', JSON.stringify(next));

      const prevMap = new Map<string, Appointment>(prev.map(a => [a.id, a]));
      next.forEach((apt: Appointment) => {
        const p = prevMap.get(apt.id);
        if (!p || p.status !== apt.status || p.paymentMethod !== apt.paymentMethod || p.date !== apt.date || p.time !== apt.time || p.barberId !== apt.barberId) {
          setSyncing(true);
          fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apt)
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error syncing appointment:", err);
            setSyncing(false);
          });
        }
      });
      return next;
    });
  };

  const handleSetReviews = (value: React.SetStateAction<Review[]>) => {
    setReviews(prev => {
      const next = (typeof value === 'function' ? (value as Function)(prev) : value) as Review[];
      
      // Save locally immediately
      localStorage.setItem('barbearia_local_reviews', JSON.stringify(next));

      const prevMap = new Map<string, Review>(prev.map(r => [r.id, r]));
      next.forEach((review: Review) => {
        const p = prevMap.get(review.id);
        if (!p || p.stars !== review.stars || p.comment !== review.comment) {
          setSyncing(true);
          fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
          })
          .then(() => setSyncing(false))
          .catch(err => {
            console.error("Error syncing review:", err);
            setSyncing(false);
          });
        }
      });
      return next;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('barbearia_current_user', JSON.stringify(user));
    handleSetUsers(prev => {
      if (!prev.some(u => u.id === user.id)) {
        return [...prev, user];
      }
      return prev;
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('barbearia_current_user');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center select-none relative overflow-hidden p-6">
        {/* Subtle background ambient gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center max-w-sm w-full z-10 text-center animate-fade-in">
          {/* Full Logo (Completely uncropped, fits beautifully) */}
          <div className="w-full max-w-[320px] mb-12 relative flex justify-center">
            <BarberLogo variant="full" className="w-full h-auto filter drop-shadow-[0_0_20px_rgba(234,179,8,0.25)]" />
          </div>

          {/* Premium Progress Bar (Replaces "BARBEARIA DO WARLEY" text) */}
          <div className="w-full space-y-3 mb-6">
            <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.15em] text-neutral-400">
              <span className="uppercase text-[#eab308] font-bold">Iniciando Experiência</span>
              <span className="font-bold text-[#eab308]">{progress}%</span>
            </div>
            
            {/* The luxury progress bar container */}
            <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800/80 rounded-full overflow-hidden relative p-[1.5px]">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 via-[#eab308] to-yellow-600 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.55)] transition-all duration-150 ease-out relative overflow-hidden" 
                style={{ width: `${progress}%` }}
              >
                {/* Highlight shimmer shine running through */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent" 
                  style={{ 
                    width: '30%', 
                    animation: 'shimmer-slide 1.2s infinite linear' 
                  }} 
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-neutral-500 font-mono tracking-[0.25em] uppercase animate-pulse">
            Sincronizando banco de dados...
          </p>
        </div>

        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer-slide {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(350%); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative">

      {/* Render Current View Dashboard */}
      <div className="flex-1">
        {!currentUser ? (
          <Login onLogin={handleLogin} availableUsers={users} />
        ) : currentUser.role === 'owner' ? (
          <OwnerDashboard
            owner={currentUser}
            onLogout={handleLogout}
            services={services}
            setServices={handleSetServices}
            appointments={appointments}
            setAppointments={handleSetAppointments}
            users={users}
            setUsers={handleSetUsers}
            reviews={reviews}
            products={products}
            setProducts={handleSetProducts}
            onUpdateOwner={(updatedOwner) => {
              setCurrentUser(updatedOwner);
              localStorage.setItem('barbearia_current_user', JSON.stringify(updatedOwner));
              // Also update this owner in the users list so it syncs to db!
              handleSetUsers(prev => prev.map(u => u.id === updatedOwner.id ? updatedOwner : u));
            }}
          />
        ) : currentUser.role === 'professional' ? (
          <ProfessionalDashboard
            barber={currentUser}
            onLogout={handleLogout}
            appointments={appointments}
            setAppointments={handleSetAppointments}
            setUsers={handleSetUsers}
            reviews={reviews}
            services={services}
            users={users}
            products={products}
            setProducts={handleSetProducts}
          />
        ) : (
          <ClientDashboard
            client={currentUser}
            onLogout={handleLogout}
            services={services}
            appointments={appointments}
            setAppointments={handleSetAppointments}
            users={users}
            setUsers={handleSetUsers}
            reviews={reviews}
            setReviews={handleSetReviews}
          />
        )}
      </div>

      {/* SCHEMA SETUP HELP MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121212] border border-neutral-800 rounded-3xl w-full max-w-2xl p-6 relative max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Configurar Tabelas no Supabase</h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Siga as instruções para criar o banco de dados</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto py-5 space-y-4 text-xs text-neutral-300 flex-1 scrollbar-thin">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-2.5">
                <h4 className="font-bold text-white text-xs">Passos Rápidos de Configuração:</h4>
                <ol className="list-decimal pl-4 space-y-2 text-neutral-400 text-xs">
                  <li>Acesse seu painel da <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#eab308] hover:underline inline-flex items-center gap-0.5 font-bold">Supabase Console <ExternalLink className="h-3 w-3 inline" /></a></li>
                  <li>Selecione o seu projeto e clique na aba **SQL Editor** no menu lateral esquerdo.</li>
                  <li>Clique em **New Query**, cole o script SQL fornecido abaixo e clique em **Run**.</li>
                  <li>Clique em **Verificar/Recarregar** na barra superior do aplicativo. O banco será populado e ativado imediatamente!</li>
                </ol>
              </div>

              {/* Code block */}
              <div className="space-y-2 shrink-0">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                  <span>Script SQL de Instalação</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-[#eab308] hover:text-[#ca8a04] transition-all cursor-pointer uppercase font-black"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado!' : 'Copiar Código'}
                  </button>
                </div>
                <pre className="p-4 bg-[#0a0a0a] rounded-xl border border-neutral-800 font-mono text-[10.5px] text-neutral-400 overflow-x-auto max-h-60 select-all leading-relaxed whitespace-pre scrollbar-thin">
                  {SCHEMA_SQL}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Tudo Pronto! Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
