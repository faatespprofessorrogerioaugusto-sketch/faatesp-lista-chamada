import React, { useState } from 'react';
import { UserSession, Student, UserRole } from '../types';
import { LogIn, GraduationCap, ShieldAlert, UserCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  students: Student[];
  onLogin: (session: UserSession, updatedStudents?: Student[]) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ students, onLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Aluno');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value.toUpperCase());
    setErrorMessage(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase());
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage('Por favor, informe seu Nome Completo.');
      return;
    }

    if (trimmedName.length < 3) {
      setErrorMessage('O Nome Completo deve ter pelo menos 3 caracteres.');
      return;
    }

    if (role === 'Aluno') {
      if (!trimmedEmail) {
        setErrorMessage('Por favor, informe seu E-mail.');
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setErrorMessage('Por favor, informe um endereço de e-mail válido.');
        return;
      }
    }

    // Normalize full name for professor check
    const normalizedFullName = trimmedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isAuthorizedProfessor = normalizedFullName === 'ROGERIO AUGUSTO FERNANDES';

    // Role validation check
    if (role === 'Professor') {
      if (!isAuthorizedProfessor) {
        setErrorMessage(
          'Área Proibida, somente os Professores tem acesso! Entre no sistema com o Perfil de Aluno!'
        );
        return;
      }

      // Successful Professor Login
      const session: UserSession = {
        name: 'Rogério Augusto - Mister Roger',
        role: 'Professor',
      };
      onLogin(session);
    } else {
      // Aluno Login
      if (isAuthorizedProfessor) {
        setErrorMessage(
          'Acesso Restrito! O nome informado pertence ao perfil Professor. Por favor, selecione o perfil "Professor" para acessar.'
        );
        return;
      }

      // Check if student exists in roster (case-insensitive name match)
      let existingStudent = students.find(
        (s) => s.name.trim().toUpperCase() === trimmedName
      );

      let currentStudents = [...students];

      // If student is not in the system, automatically register them!
      if (!existingStudent) {
        const nextNumber = students.length + 1;
        const autoRegistrationId = `2026${String(nextNumber).padStart(3, '0')}`;
        const newStudent: Student = {
          id: `st-${Date.now()}`,
          name: trimmedName,
          email: trimmedEmail,
          registrationId: autoRegistrationId,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        currentStudents.push(newStudent);
        existingStudent = newStudent;
      } else {
        // If student exists but didn't have email or email changed, update it
        if (existingStudent.email !== trimmedEmail) {
          currentStudents = currentStudents.map((s) =>
            s.id === existingStudent?.id ? { ...s, email: trimmedEmail } : s
          );
        }
      }

      const session: UserSession = {
        name: trimmedName,
        role: 'Aluno',
        studentId: existingStudent.id,
      };

      onLogin(session, currentStudents);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100 animate-scale-up">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-3.5 rounded-2xl mb-1 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Disciplina: Consultoria Organizacional
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Sistema de Chamada e Gestão de Frequência • Acesso Obrigatório
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-4 rounded-2xl text-xs font-semibold flex items-start gap-3 animate-fade-in">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome Completo */}
          <div>
            <label htmlFor="login-fullname-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome Completo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="login-fullname-input"
              required
              autoFocus
              value={fullName}
              onChange={handleNameChange}
              placeholder="DIGITE SEU NOME COMPLETO..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 font-bold rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 uppercase placeholder:text-slate-500 placeholder:normal-case placeholder:font-normal text-sm transition-all"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              O texto será automaticamente convertido para letras maiúsculas.
            </span>
          </div>

          {/* E-mail (Obrigatório para o Aluno) */}
          <div>
            <label htmlFor="login-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              E-mail {role === 'Aluno' && <span className="text-rose-400">*</span>}
            </label>
            <input
              type="email"
              id="login-email-input"
              required={role === 'Aluno'}
              value={email}
              onChange={handleEmailChange}
              placeholder="seu.email@exemplo.com"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 font-medium rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 lowercase placeholder:text-slate-500 placeholder:normal-case text-sm transition-all"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              O e-mail será forçado automaticamente para letras minúsculas.
            </span>
          </div>

          {/* Tipo de Usuário (Perfil) */}
          <div>
            <label htmlFor="login-role-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Perfil / Tipo de Usuário <span className="text-rose-400">*</span>
            </label>
            <select
              id="login-role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRole);
                setErrorMessage(null);
              }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 font-bold rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer transition-all"
            >
              <option value="Aluno">Aluno</option>
              <option value="Professor">Professor</option>
            </select>
          </div>

          {/* Info Card according to selected role */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 flex items-start gap-2.5">
            {role === 'Professor' ? (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Área restrita e protegida para o <strong>Corpo Docente</strong>.
                </span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Como <strong>Aluno</strong>, insira seu nome completo para registrar e consultar sua frequência e notas.
                </span>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar no Sistema</span>
          </button>
        </form>
      </div>
    </div>
  );
};
