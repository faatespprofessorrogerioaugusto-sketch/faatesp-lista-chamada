import React from 'react';
import { UserSession, AppTab } from '../types';
import {
  LayoutDashboard,
  ClipboardCheck,
  UserSearch,
  BookOpenCheck,
  Users,
  FileSpreadsheet,
  Upload,
  Trash2,
  GraduationCap,
  LogOut,
  PlusCircle,
  UserCheck,
  Award
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserSession | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onExportExcel: () => void;
  onOpenImportModal: () => void;
  onResetData: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onExportExcel,
  onOpenImportModal,
  onResetData,
  onLogout,
}) => {
  const isProfessor = currentUser?.role === 'Professor';
  const isAluno = currentUser?.role === 'Aluno';

  return (
    <header className="bg-[#0f172a]/95 text-slate-100 border-b border-slate-800/80 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">Disciplina: Consultoria Organizacional</h1>
                
                {/* User Role Badge next to title */}
                {currentUser && (
                  <span
                    id="user-role-badge"
                    className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                      isProfessor
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>
                      {isProfessor ? 'Professor: Rogério Augusto - Mister Roger' : `${currentUser.role}: ${currentUser.name}`}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Sistema de Chamada e Gestão de Frequência de Alunos</p>
            </div>
          </div>

          {/* Top Actions & Logout */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isProfessor && (
              <>
                <button
                  onClick={onExportExcel}
                  id="export-excel-btn"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                  title="Baixar planilha Excel (.xlsx) com a matriz de presença completa"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </button>

                <button
                  onClick={onOpenImportModal}
                  id="import-excel-btn"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                  title="Importar lista de alunos ou modelo Excel"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Importar</span>
                </button>

                <button
                  onClick={onResetData}
                  id="reset-data-btn"
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/60 transition-colors cursor-pointer"
                  title="Limpar todos os alunos e chamadas salvas do sistema"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Limpar Dados</span>
                </button>
              </>
            )}

            {/* Logout / Sair do Sistema */}
            <button
              onClick={onLogout}
              id="logout-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 transition-all shadow-sm cursor-pointer ml-auto sm:ml-0"
              title="Sair do Sistema"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none" aria-label="Navegação Principal">
          {/* PROFESSOR TABS */}
          {isProfessor && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                id="nav-tab-dashboard"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Unificado</span>
              </button>

              <button
                onClick={() => setActiveTab('student-query')}
                id="nav-tab-student-query"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'student-query'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <UserSearch className="w-4 h-4" />
                <span>Consulta por Aluno</span>
              </button>

              <button
                onClick={() => setActiveTab('class-history')}
                id="nav-tab-class-history"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'class-history'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <BookOpenCheck className="w-4 h-4" />
                <span>Aulas Realizadas</span>
              </button>

              <button
                onClick={() => setActiveTab('roll-call')}
                id="nav-tab-roll-call"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'roll-call'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Chamada</span>
              </button>

              <button
                onClick={() => setActiveTab('students')}
                id="nav-tab-students"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gestão de Alunos</span>
              </button>

              <button
                onClick={() => setActiveTab('grades')}
                id="nav-tab-grades"
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'grades'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Boletim de Notas</span>
              </button>
            </>
          )}

          {/* ALUNO TABS */}
          {isAluno && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('roll-call')}
                id="nav-tab-student-roll-call"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'roll-call'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Registrar Chamada</span>
              </button>

              <button
                onClick={() => setActiveTab('grades')}
                id="nav-tab-student-grades"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'grades'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Boletim de Notas</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};


