import React, { useState } from 'react';
import { LogIn, UserPlus, User as UserIcon, Scissors, Mail, Lock, Phone, Info, Calendar } from 'lucide-react';
import { UserRole, User } from '../types';
import BarberLogo from './BarberLogo';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

export default function Login({ onLogin, availableUsers }: LoginProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('client');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'login') {
      if (loginMethod === 'phone') {
        if (!phone) {
          setError('Por favor, informe seu telefone.');
          return;
        }
        const digitsInput = phone.replace(/\D/g, '');
        if (!digitsInput) {
          setError('Telefone inválido.');
          return;
        }
        // Match registered user's phone
        const found = availableUsers.find(
          (u) => u.phone.replace(/\D/g, '') === digitsInput
        );
        if (found) {
          onLogin(found);
        } else {
          setError('Telefone não cadastrado. Vá na aba "Cadastrar" para criar sua conta!');
        }
      } else {
        if (!email && !password) {
          setError('Por favor, informe seu e-mail e senha, ou use sua senha única de acesso.');
          return;
        }

        let found: User | undefined;

        // 1. If only password is provided, seek user with this password
        if (password && !email) {
          found = availableUsers.find(
            (u) => u.password && u.password === password
          );
          if (!found) {
            setError('Senha de acesso única inválida.');
            return;
          }
        } 
        // 2. If email is provided (could be actual email or they typed password there)
        else if (email) {
          found = availableUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
          );

          if (found) {
            if (found.password && found.password !== password) {
              setError('Senha de acesso incorreta para este usuário.');
              return;
            }
          } else {
            // Check if they put their password into the first input field
            const foundByPassword = availableUsers.find(
              (u) => u.password && u.password === email
            );
            if (foundByPassword) {
              found = foundByPassword;
            } else {
              setError('Usuário não encontrado. Verifique seu e-mail e senha.');
              return;
            }
          }
        }

        if (found) {
          onLogin(found);
        } else {
          setError('Credenciais inválidas.');
        }
      }
    } else {
      // Customer registration only
      if (!firstName || !lastName || !birthDate || !phone) {
        setError('Por favor, preencha todos os campos (Nome, Sobrenome, Data de Nascimento e Telefone).');
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneExists = availableUsers.some(
        (u) => u.phone.replace(/\D/g, '') === cleanPhone
      );
      if (phoneExists) {
        setError('Este telefone já está cadastrado. Vá em "Entrar" e acesse com seu celular!');
        return;
      }

      // Generate a valid unique email to satisfy potential DB constraints
      const generatedEmail = `c-${cleanPhone || Date.now()}@barbearia.com`;

      const newUser: User = {
        id: 'user-' + Date.now(),
        name: `${firstName} ${lastName}`.trim(),
        email: generatedEmail,
        phone,
        role: 'client',
        points: 0,
        birthDate
      };
      onLogin(newUser);
    }
  };

  const handleQuickLogin = (emailAddress: string) => {
    const found = availableUsers.find(
      (u) => u.email.toLowerCase() === emailAddress.toLowerCase()
    );
    if (found) {
      onLogin(found);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      {/* Brand Identity */}
      <div className="flex flex-col items-center mb-6 text-center animate-fade-in w-full max-w-sm">
        <BarberLogo variant="full" className="w-full h-auto filter drop-shadow-[0_0_15px_rgba(234,179,8,0.15)]" />
        <p className="text-neutral-400 font-light mt-4">Acesse sua conta para continuar</p>
      </div>

      {/* Main Form Box */}
      <main className="w-full max-w-md bg-[#161616] border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        {/* Tab Selection */}
        <div className="flex bg-[#222] rounded-xl p-1 mb-6">
          <button
            id="tab-login"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
              tab === 'login'
                ? 'bg-[#eab308] text-black shadow-lg shadow-[#eab308]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </button>
          <button
            id="tab-register"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${
              tab === 'register'
                ? 'bg-[#eab308] text-black shadow-lg shadow-[#eab308]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-5">
          {/* Login Type Selection (Only shown when logging in) */}
          {tab === 'login' && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Entrar como:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="login-method-phone"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${
                    loginMethod === 'phone'
                      ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308] font-bold'
                      : 'border-transparent bg-[#222] text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  <span>Cliente (Celular)</span>
                </button>
                <button
                  type="button"
                  id="login-method-email"
                  onClick={() => setLoginMethod('email')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${
                    loginMethod === 'email'
                      ? 'border-[#eab308] bg-[#eab308]/10 text-[#eab308] font-bold'
                      : 'border-transparent bg-[#222] text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Equipe</span>
                </button>
              </div>
            </div>
          )}

          {/* First Name & Last Name (Registration only) */}
          {tab === 'register' && (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="reg-first-name">
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="reg-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Seu nome"
                    className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-9 pr-3 focus:ring-2 focus:ring-[#eab308] text-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="reg-last-name">
                  Sobrenome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="reg-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Sobrenome"
                    className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-9 pr-3 focus:ring-2 focus:ring-[#eab308] text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date of Birth (Registration only) */}
          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="reg-birthdate">
                Data de nascimento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  type="date"
                  id="reg-birthdate"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-[#eab308] text-base font-medium"
                />
              </div>
            </div>
          )}

          {/* Email Input (Login only) */}
          {(tab === 'login' && loginMethod === 'email') && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="login-email">
                Email de Acesso <span className="text-neutral-500 font-normal text-xs">(Deixe em branco para entrar apenas com a Senha Única)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email cadastrado ou em branco"
                  className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-[#eab308] text-base font-medium"
                />
              </div>
            </div>
          )}

          {/* Phone Input */}
          {(tab === 'register' || (tab === 'login' && loginMethod === 'phone')) && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="reg-phone">
                Telefone / Celular
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  id="reg-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(67) 99215-4634"
                  className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-[#eab308] text-base font-medium"
                />
              </div>
            </div>
          )}

          {/* Password Input (Login only) */}
          {(tab === 'login' && loginMethod === 'email') && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="login-pass">
                Senha / Senha Única do Barbeiro
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  id="login-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha única ou do dono"
                  className="block w-full bg-[#e8f0fe] border-none text-black placeholder-neutral-500 rounded-xl py-3.5 pl-11 pr-4 focus:ring-2 focus:ring-[#eab308] text-base font-medium"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-auth-submit"
            className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold py-4 rounded-xl shadow-lg shadow-[#eab308]/20 transition-all active:scale-[0.98] text-base cursor-pointer"
          >
            {tab === 'login' ? 'Entrar' : 'Cadastrar Conta'}
          </button>
        </form>

        {tab === 'login' && loginMethod === 'email' && (
          <div className="mt-5 text-center">
            <a href="#" className="text-sm text-neutral-500 hover:text-[#eab308] transition-colors">
              Esqueceu sua senha?
            </a>
          </div>
        )}
      </main>

      {/* Quick demo account switcher */}
      <div className="w-full max-w-md mt-6 bg-[#161616]/40 border border-neutral-800/60 rounded-2xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 text-center">
          Acesso de Demonstração Rápido (Níveis de Acesso)
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleQuickLogin('dhonathanbertotti@gmail.com')}
            className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse"></span>
              <div>
                <p className="font-bold text-white">Dhonathan Elias Bertotti</p>
                <p className="text-[10px] text-neutral-400">Administrador / Proprietário</p>
              </div>
            </div>
            <span className="text-yellow-500 font-semibold group-hover:translate-x-1 transition-transform">Admin &rarr;</span>
          </button>

          <button
            onClick={() => handleQuickLogin('warley@gmail.com')}
            className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <div>
                <p className="font-bold text-white">Warley Ferreira</p>
                <p className="text-[10px] text-neutral-400">Proprietário (Financeiro + Gestão)</p>
              </div>
            </div>
            <span className="text-yellow-500 font-semibold group-hover:translate-x-1 transition-transform">Dono &rarr;</span>
          </button>

          <button
            onClick={() => handleQuickLogin('erick@gmail.com')}
            className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <div>
                <p className="font-bold text-white">Erick Mathues</p>
                <p className="text-[10px] text-neutral-400">Profissional (Agenda Própria - Sem Finanças)</p>
              </div>
            </div>
            <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">Barbeiro &rarr;</span>
          </button>

          <button
            onClick={() => handleQuickLogin('ricardo.f@email.com')}
            className="flex items-center justify-between p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-left transition-colors text-xs group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <div>
                <p className="font-bold text-white">Ricardo Ferreira</p>
                <p className="text-[10px] text-neutral-400">Cliente VIP (Fidelidade + Agendamentos)</p>
              </div>
            </div>
            <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">Cliente &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
