import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { getCourseOverviewStats, getStudentStats } from '../utils/storage';
import {
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Percent,
  Filter,
  AlertTriangle,
  Award,
  Search,
  ArrowRight,
  User,
  Calendar,
  FileSpreadsheet,
  Clock
} from 'lucide-react';

interface UnifiedDashboardProps {
  students: Student[];
  classes: ClassSession[];
  onSelectStudentForQuery: (studentId: string) => void;
  onNavigateToRollCall: () => void;
  onExportExcel: () => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  students,
  classes,
  onSelectStudentForQuery,
  onNavigateToRollCall,
  onExportExcel,
}) => {
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all'); // 'all' or student.id
  const [searchTerm, setSearchTerm] = useState('');

  const overview = getCourseOverviewStats(students, classes);

  // If a specific student is selected
  const selectedStudent = students.find((s) => s.id === selectedStudentFilter);
  const selectedStudentStats = selectedStudent ? getStudentStats(selectedStudent, classes) : null;

  // Filter student list for summary table
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.registrationId && s.registrationId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls Bar */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Dashboard Unificado de Frequência</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Visão consolidada do curso de <strong className="text-slate-200">Consultoria Organizacional</strong>
          </p>
        </div>

        {/* Dynamic Filter dropdown (General vs Individual Student) */}
        <div className="w-full md:w-auto flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80">
          <div className="flex items-center gap-2 text-slate-400 pl-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">Modo de Exibição:</span>
          </div>
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            id="dashboard-student-filter"
            className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 font-medium cursor-pointer shadow-xs"
          >
            <option value="all">📊 Visão Geral (Todos os Alunos)</option>
            <optgroup label="Alunos Individuais">
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  👤 {st.name} {st.registrationId ? `(${st.registrationId})` : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Banner when filtered by individual student */}
      {selectedStudent && selectedStudentStats && (
        <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{selectedStudent.name}</h3>
                {selectedStudent.registrationId && (
                  <span className="bg-indigo-900/90 text-indigo-300 border border-indigo-700 text-xs px-2 py-0.5 rounded-md font-mono">
                    Matrícula: {selectedStudent.registrationId}
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Exibindo métricas individuais de presença e ausências neste curso.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onSelectStudentForQuery(selectedStudent.id)}
              id="view-student-full-history-btn"
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Ver Histórico Detalhado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedStudentFilter('all')}
              id="clear-student-filter-btn"
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Voltar ao Geral
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total de Alunos */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Alunos</span>
            <div className="bg-blue-500/10 text-blue-400 p-2 rounded-xl border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {selectedStudent ? 1 : overview.totalStudents}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {selectedStudent ? 'Aluno selecionado' : 'Alunos matriculados'}
            </p>
          </div>
        </div>

        {/* Card 2: Quantidade de Aulas */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aulas Ministradas</span>
            <div className="bg-purple-500/10 text-purple-400 p-2 rounded-xl border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {overview.totalClasses}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Encontros de chamada salvos
            </p>
          </div>
        </div>

        {/* Card 3: Total de Presenças */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Presenças</span>
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {selectedStudentStats ? selectedStudentStats.presences : overview.totalPresences}
            </span>
            {selectedStudentStats && selectedStudentStats.justified > 0 && (
              <span className="text-xs text-amber-400 ml-2 font-medium">
                (+{selectedStudentStats.justified} justif.)
              </span>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Registros de presença
            </p>
          </div>
        </div>

        {/* Card 4: Total de Ausências */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Ausências</span>
            <div className="bg-rose-500/10 text-rose-400 p-2 rounded-xl border border-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {selectedStudentStats ? selectedStudentStats.absences : overview.totalAbsences}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Faltas não justificadas
            </p>
          </div>
        </div>

        {/* Card 5: Percentual de Presenças */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">% Frequência</span>
            <div className="bg-amber-500/10 text-amber-400 p-2 rounded-xl border border-amber-500/20">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  (selectedStudentStats ? selectedStudentStats.presencePercentage : overview.overallPresencePercentage) >= 75
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {selectedStudentStats ? selectedStudentStats.presencePercentage : overview.overallPresencePercentage}%
              </span>
            </div>
            {/* Small status indicator */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (selectedStudentStats ? selectedStudentStats.presencePercentage : overview.overallPresencePercentage) >= 75
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
                style={{
                  width: `${selectedStudentStats ? selectedStudentStats.presencePercentage : overview.overallPresencePercentage}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert Banner for Students Below 75% Requirement */}
      {overview.studentsWarningCount > 0 && !selectedStudent && (
        <div className="bg-amber-950/50 border border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-200">
                Atenção: {overview.studentsWarningCount} {overview.studentsWarningCount === 1 ? 'aluno está' : 'alunos estão'} com frequência abaixo de 75%
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                O limite acadêmico exigido para aprovação no curso de Consultoria Organizacional é de 75%.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const warningStudent = students.find((s) => getStudentStats(s, classes).presencePercentage < 75);
              if (warningStudent) onSelectStudentForQuery(warningStudent.id);
            }}
            id="view-warning-students-btn"
            className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Verificar Alunos em Risco
          </button>
        </div>
      )}

      {/* Main Content Area: Quick Action Cards & Student Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Course Class Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Ações Rápidas de Chamada</span>
            </h3>

            <button
              onClick={onNavigateToRollCall}
              id="dashboard-new-rollcall-btn"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Iniciar Nova Chamada de Aula</span>
            </button>

            <button
              onClick={onExportExcel}
              id="dashboard-export-excel-btn"
              className="w-full py-2.5 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Baixar Planilha Excel (.xlsx)</span>
            </button>
          </div>

          {/* Classes Breakdown List */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Últimas Aulas Marcadas</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {classes.length} aulas
              </span>
            </div>

            {classes.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Nenhuma aula registrada ainda. Clique em "Iniciar Nova Chamada".
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {[...classes]
                  .sort((a, b) => b.classNumber - a.classNumber)
                  .map((c) => {
                    let p = 0;
                    let a = 0;
                    let j = 0;
                    Object.values(c.records).forEach((st) => {
                      if (st === 'present') p++;
                      else if (st === 'absent') a++;
                      else if (st === 'justified') j++;
                    });
                    const rate = students.length > 0 ? Math.round(((p + j) / students.length) * 100) : 0;

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">
                              Aula #{c.classNumber}
                            </span>
                            <span className="text-slate-400 font-mono">{formatDateDisplay(c.date)}</span>
                          </div>
                          <p className="font-medium text-slate-200 mt-1 line-clamp-1">{c.topic}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                              rate >= 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {rate}% freq.
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p} Pres. / {a} Aus.
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Student Attendance Overview Table */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Desempenho da Turma de Consultoria</span>
              </h3>
              <p className="text-xs text-slate-400">Resumo individual de presença por aluno</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por aluno ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="dashboard-search-student-input"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Students List Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3">Aluno / Matrícula</th>
                  <th className="p-3 text-center">Presenças</th>
                  <th className="p-3 text-center">Faltas</th>
                  <th className="p-3 text-center">% Frequência</th>
                  <th className="p-3 text-center">Situação</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                      Nenhum aluno encontrado para a busca "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const stats = getStudentStats(st, classes);
                    const isWarning = stats.presencePercentage < 75;

                    return (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          selectedStudentFilter === st.id ? 'bg-indigo-950/40' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-200">{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {st.registrationId || 'Sem matrícula'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {stats.presences}
                          </span>
                          {stats.justified > 0 && (
                            <span className="text-[10px] text-amber-400 block mt-0.5">
                              +{stats.justified} just.
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            {stats.absences}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {stats.presencePercentage}%
                            </span>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${stats.presencePercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Risco (&lt;75%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              <Award className="w-3 h-3" />
                              Aprovado
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onSelectStudentForQuery(st.id)}
                            id={`view-student-btn-${st.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-800/60"
                          >
                            Consultar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
