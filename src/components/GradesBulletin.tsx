import React, { useState, useMemo } from 'react';
import { Student, ClassSession, StudentGrade, CalculatedStudentGrade, UserRole } from '../types';
import { calculateStudentGrade, saveGrades } from '../utils/storage';
import {
  Award,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  Save,
  X,
  FileSpreadsheet,
  Printer,
  Info,
  GraduationCap
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface GradesBulletinProps {
  students: Student[];
  classes: ClassSession[];
  grades: Record<string, StudentGrade>;
  onUpdateGrades: (updatedGrades: Record<string, StudentGrade>) => void;
  currentUserRole: UserRole;
  currentStudentId?: string;
  currentUserName?: string;
}

export const GradesBulletin: React.FC<GradesBulletinProps> = ({
  students,
  classes,
  grades,
  onUpdateGrades,
  currentUserRole,
  currentStudentId,
  currentUserName,
}) => {
  const isProfessor = currentUserRole === 'Professor';
  const isAluno = currentUserRole === 'Aluno';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Aprovado' | 'Recuperação' | 'Dependência' | 'Pendente'>('ALL');

  // Modal for Teacher Editing
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<{
    activityN1: string;
    examN1: string;
    activityN2: string;
    examN2: string;
  }>({
    activityN1: '',
    examN1: '',
    activityN2: '',
    examN2: '',
  });

  // Calculate grades for all students (sorted alphabetically A-Z)
  const calculatedList: CalculatedStudentGrade[] = useMemo(() => {
    const list = students.map((student) => {
      const studentGrade = grades[student.id];
      return calculateStudentGrade(student, studentGrade, classes);
    });
    return list.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR', { sensitivity: 'base' }));
  }, [students, grades, classes]);

  // If user is Aluno, find student record (by ID or matching name)
  const currentStudentGrade = useMemo(() => {
    if (!isAluno) return null;
    if (currentStudentId) {
      const found = calculatedList.find((c) => c.studentId === currentStudentId);
      if (found) return found;
    }
    if (currentUserName) {
      const normalizedCurrentName = currentUserName.trim().toUpperCase();
      return calculatedList.find((c) => c.studentName.trim().toUpperCase() === normalizedCurrentName) || null;
    }
    return null;
  }, [isAluno, currentStudentId, currentUserName, calculatedList]);

  // Statistics for Overview
  const stats = useMemo(() => {
    let approved = 0;
    let recovery = 0;
    let dependency = 0;
    let pending = 0;
    let sumFinalGrades = 0;
    let countedFinalGrades = 0;

    calculatedList.forEach((item) => {
      if (item.status === 'Aprovado') approved++;
      else if (item.status === 'Recuperação') recovery++;
      else if (item.status === 'Dependência') dependency++;
      else pending++;

      if (item.mediaFinal !== null) {
        sumFinalGrades += item.mediaFinal;
        countedFinalGrades++;
      }
    });

    const averageFinalGrade = countedFinalGrades > 0 ? (sumFinalGrades / countedFinalGrades).toFixed(1) : '—';

    return {
      total: calculatedList.length,
      approved,
      recovery,
      dependency,
      pending,
      averageFinalGrade,
    };
  }, [calculatedList]);

  // Filtered list for display
  const filteredList = useMemo(() => {
    return calculatedList.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.registrationId && item.registrationId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [calculatedList, searchTerm, statusFilter]);

  // Open Edit Modal
  const handleOpenEditModal = (student: Student) => {
    const currentGrade = grades[student.id];
    setEditingStudent(student);
    setEditForm({
      activityN1: currentGrade?.activityN1 !== undefined && currentGrade.activityN1 !== null ? String(currentGrade.activityN1) : '',
      examN1: currentGrade?.examN1 !== undefined && currentGrade.examN1 !== null ? String(currentGrade.examN1) : '',
      activityN2: currentGrade?.activityN2 !== undefined && currentGrade.activityN2 !== null ? String(currentGrade.activityN2) : '',
      examN2: currentGrade?.examN2 !== undefined && currentGrade.examN2 !== null ? String(currentGrade.examN2) : '',
    });
  };

  // Save Modal Form
  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const parseVal = (val: string): number | null => {
      if (val.trim() === '') return null;
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num)) return null;
      return Math.max(0, Math.min(10, num));
    };

    const newGrade: StudentGrade = {
      studentId: editingStudent.id,
      activityN1: parseVal(editForm.activityN1),
      examN1: parseVal(editForm.examN1),
      activityN2: parseVal(editForm.activityN2),
      examN2: parseVal(editForm.examN2),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...grades,
      [editingStudent.id]: newGrade,
    };

    onUpdateGrades(updated);
    saveGrades(updated);
    setEditingStudent(null);
  };

  // Clear / Delete Grades for a student
  const handleClearGrades = (studentId: string, studentName: string) => {
    if (!window.confirm(`Deseja realmente limpar/excluir as notas lançadas para o aluno "${studentName}"?`)) {
      return;
    }

    const updated = { ...grades };
    delete updated[studentId];

    onUpdateGrades(updated);
    saveGrades(updated);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const data = calculatedList.map((item) => ({
      Matrícula: item.registrationId || '—',
      Aluno: item.studentName,
      'Ativ. N1 (Peso 6)': item.activityN1 !== null ? item.activityN1 : '—',
      'Aval. N1 (Peso 4)': item.examN1 !== null ? item.examN1 : '—',
      'Média N1': item.mediaN1 !== null ? item.mediaN1 : '—',
      'Ativ. N2 (Peso 4)': item.activityN2 !== null ? item.activityN2 : '—',
      'Aval. N2 (Peso 6)': item.examN2 !== null ? item.examN2 : '—',
      'Média N2': item.mediaN2 !== null ? item.mediaN2 : '—',
      'Frequência (%)': `${item.presencePercentage}%`,
      'Bônus (+0.5)': item.hasBonus ? '+0.5' : 'Não',
      'Média Final': item.mediaFinal !== null ? item.mediaFinal : '—',
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Boletim_Notas');
    XLSX.writeFile(workbook, `Boletim_Notas_Consultoria_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Status Badge Component Helper
  const renderStatusBadge = (status: CalculatedStudentGrade['status']) => {
    switch (status) {
      case 'Aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Aprovado</span>
          </span>
        );
      case 'Recuperação':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Recuperação</span>
          </span>
        );
      case 'Dependência':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Dependência</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  // Modal live preview calculation
  const modalLiveCalc = useMemo(() => {
    if (!editingStudent) return null;
    const parseVal = (val: string): number | null => {
      if (val.trim() === '') return null;
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num)) return null;
      return Math.max(0, Math.min(10, num));
    };

    const tempGrade: StudentGrade = {
      studentId: editingStudent.id,
      activityN1: parseVal(editForm.activityN1),
      examN1: parseVal(editForm.examN1),
      activityN2: parseVal(editForm.activityN2),
      examN2: parseVal(editForm.examN2),
    };

    return calculateStudentGrade(editingStudent, tempGrade, classes);
  }, [editingStudent, editForm, classes]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Avaliação de Rendimento e Frequência</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Boletim de Notas
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Cálculo ponderado automático de notas (N1 e N2) com bonificação por assiduidade e classificação acadêmica em tempo real.
            </p>
          </div>

          {/* Quick Actions (Professor only) */}
          {isProfessor && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportExcel}
                id="btn-export-grades-excel"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Boletim (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                id="btn-print-grades"
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
            </div>
          )}
        </div>

        {/* Academic Rules Summary Box */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Composição dos Pesos</span>
            </div>
            <div className="text-slate-400 space-y-0.5">
              <p>• <strong>N1:</strong> Atividade (Peso 6) + Avaliação (Peso 4)</p>
              <p>• <strong>N2:</strong> Atividade (Peso 4) + Avaliação (Peso 6)</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Bônus de Assiduidade</span>
            </div>
            <p className="text-slate-400">
              <strong>+0,5 ponto</strong> na Média Final para alunos com <strong>frequência &ge; 75%</strong> e <strong>média base entre 6,5 e 6,9</strong>.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <div className="font-bold text-slate-200 mb-1">Critérios de Status e Cores</div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                &le; 3,0: Dependência 🔴
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                &le; 6,9: Recuperação 🟢
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                &gt; 6,9 (&ge; 7,0): Aprovado 🔵
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT PERSONAL VIEW (Card Exclusivo do Aluno) */}
      {isAluno && currentStudentGrade && (
        <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black text-xl shadow-inner">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase">
                  Meu Boletim Oficial • {currentStudentGrade.registrationId || 'Matrícula Ativa'}
                </span>
                <h3 className="text-2xl font-black text-white">{currentStudentGrade.studentName}</h3>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block mb-1">Resultado Atual</span>
              {renderStatusBadge(currentStudentGrade.status)}
            </div>
          </div>

          {/* Cards Grid: N1, N2, Frequency, Final */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bloco N1 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Etapa N1</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-950 text-indigo-300 font-mono rounded font-bold">
                  {currentStudentGrade.mediaN1 !== null ? `${currentStudentGrade.mediaN1}` : '—'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Atividade N1 (Peso 6):</span>
                  <span className="font-bold text-white font-mono">{currentStudentGrade.activityN1 !== null ? currentStudentGrade.activityN1 : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avaliação N1 (Peso 4):</span>
                  <span className="font-bold text-white font-mono">{currentStudentGrade.examN1 !== null ? currentStudentGrade.examN1 : '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Fórmula: (Ativ &times; 0,6) + (Aval &times; 0,4)
              </div>
            </div>

            {/* Bloco N2 */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Etapa N2</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-950 text-indigo-300 font-mono rounded font-bold">
                  {currentStudentGrade.mediaN2 !== null ? `${currentStudentGrade.mediaN2}` : '—'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Atividade N2 (Peso 4):</span>
                  <span className="font-bold text-white font-mono">{currentStudentGrade.activityN2 !== null ? currentStudentGrade.activityN2 : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avaliação N2 (Peso 6):</span>
                  <span className="font-bold text-white font-mono">{currentStudentGrade.examN2 !== null ? currentStudentGrade.examN2 : '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                Fórmula: (Ativ &times; 0,4) + (Aval &times; 0,6)
              </div>
            </div>

            {/* Bloco Frequência & Bônus */}
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Frequência</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  currentStudentGrade.presencePercentage >= 75
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                }`}>
                  {currentStudentGrade.presencePercentage}%
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Média Base:</span>
                  <span className="font-bold text-white font-mono">{currentStudentGrade.mediaBase !== null ? currentStudentGrade.mediaBase : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Bônus Assiduidade:</span>
                  {currentStudentGrade.hasBonus ? (
                    <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> +0,5 pt
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">0,0 pt</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                {currentStudentGrade.hasBonus ? 'Bônus de 0,5 ponto aplicado!' : 'Bônus aplicável para média 6,5 a 6,9 com freq. &ge;75%'}
              </div>
            </div>

            {/* Bloco Média Final */}
            <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-500/30 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-1">Média Final</span>
                <div className="text-4xl font-black text-white font-mono">
                  {currentStudentGrade.mediaFinal !== null ? currentStudentGrade.mediaFinal : '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Status Acadêmico</span>
                {renderStatusBadge(currentStudentGrade.status)}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Para dúvidas quanto aos lançamentos de notas, consulte o professor responsável.</span>
            <span className="text-slate-500 font-medium">Modo Somente Visualização</span>
          </div>
        </div>
      )}

      {/* PROFESSOR OVERVIEW STATS */}
      {isProfessor && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Alunos</span>
            <p className="text-2xl font-black text-white mt-1 font-mono">{stats.total}</p>
          </div>

          <div className="bg-slate-900 border border-blue-900/40 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Aprovados (Azul)</span>
            <p className="text-2xl font-black text-blue-300 mt-1 font-mono">{stats.approved}</p>
          </div>

          <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Recuperação (Verde)</span>
            <p className="text-2xl font-black text-emerald-300 mt-1 font-mono">{stats.recovery}</p>
          </div>

          <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Dependência (Vermelho)</span>
            <p className="text-2xl font-black text-rose-300 mt-1 font-mono">{stats.dependency}</p>
          </div>

          <div className="bg-slate-900 border border-indigo-900/40 p-4 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Média Geral Turma</span>
            <p className="text-2xl font-black text-indigo-300 mt-1 font-mono">{stats.averageFinalGrade}</p>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {(['ALL', 'Aprovado', 'Recuperação', 'Dependência', 'Pendente'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {filter === 'ALL' ? 'Todos' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRADES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4">Aluno / Matrícula</th>
                <th className="py-4 px-3 text-center bg-slate-900/40">Ativ. N1 <span className="text-[10px] text-slate-500 block">(Peso 6)</span></th>
                <th className="py-4 px-3 text-center bg-slate-900/40">Aval. N1 <span className="text-[10px] text-slate-500 block">(Peso 4)</span></th>
                <th className="py-4 px-3 text-center font-extrabold text-indigo-300 bg-indigo-950/30">Média N1</th>
                <th className="py-4 px-3 text-center bg-slate-900/40">Ativ. N2 <span className="text-[10px] text-slate-500 block">(Peso 4)</span></th>
                <th className="py-4 px-3 text-center bg-slate-900/40">Aval. N2 <span className="text-[10px] text-slate-500 block">(Peso 6)</span></th>
                <th className="py-4 px-3 text-center font-extrabold text-indigo-300 bg-indigo-950/30">Média N2</th>
                <th className="py-4 px-3 text-center">Freq. %</th>
                <th className="py-4 px-3 text-center text-amber-300">Bônus</th>
                <th className="py-4 px-3 text-center font-black text-white bg-indigo-900/30">Média Final</th>
                <th className="py-4 px-4 text-center">Status</th>
                {isProfessor && <th className="py-4 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={isProfessor ? 12 : 11} className="py-12 text-center text-slate-500">
                    Nenhum aluno encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, index) => (
                  <tr
                    key={item.studentId}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                    }`}
                  >
                    {/* Aluno */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{item.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.registrationId || 'Sem matrícula'}</div>
                    </td>

                    {/* Ativ N1 */}
                    <td className="py-3.5 px-3 text-center font-mono bg-slate-900/20">
                      {item.activityN1 !== null ? item.activityN1.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Aval N1 */}
                    <td className="py-3.5 px-3 text-center font-mono bg-slate-900/20">
                      {item.examN1 !== null ? item.examN1.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Media N1 */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-300 bg-indigo-950/20">
                      {item.mediaN1 !== null ? item.mediaN1.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Ativ N2 */}
                    <td className="py-3.5 px-3 text-center font-mono bg-slate-900/20">
                      {item.activityN2 !== null ? item.activityN2.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Aval N2 */}
                    <td className="py-3.5 px-3 text-center font-mono bg-slate-900/20">
                      {item.examN2 !== null ? item.examN2.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Media N2 */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-300 bg-indigo-950/20">
                      {item.mediaN2 !== null ? item.mediaN2.toFixed(1) : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Freq % */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.presencePercentage >= 75 ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                      }`}>
                        {item.presencePercentage}%
                      </span>
                    </td>

                    {/* Bonus */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      {item.hasBonus ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px] inline-flex items-center gap-0.5 border border-amber-500/30">
                          <Sparkles className="w-3 h-3" /> +0,5
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Media Final */}
                    <td className="py-3.5 px-3 text-center font-mono font-black text-sm text-white bg-indigo-900/20">
                      {item.mediaFinal !== null ? item.mediaFinal.toFixed(1) : <span className="text-slate-600 font-normal text-xs">—</span>}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Ações (Professor Only) */}
                    {isProfessor && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const s = students.find((st) => st.id === item.studentId);
                              if (s) handleOpenEditModal(s);
                            }}
                            id={`btn-edit-grade-${item.studentId}`}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer"
                            title="Lançar / Alterar Notas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleClearGrades(item.studentId, item.studentName)}
                            id={`btn-delete-grade-${item.studentId}`}
                            className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                            title="Limpar / Excluir Notas deste Aluno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROFESSOR EDIT MODAL */}
      {editingStudent && modalLiveCalc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Lançamento de Notas</span>
                <h3 className="text-xl font-black text-white">{editingStudent.name}</h3>
                <p className="text-xs text-slate-400">{editingStudent.registrationId || 'Matrícula Ativa'}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditModal} className="space-y-4">
              {/* Etapa N1 */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Etapa N1</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Média N1: <strong className="text-white">{modalLiveCalc.mediaN1 !== null ? modalLiveCalc.mediaN1 : '—'}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Atividade N1 <span className="text-indigo-400">(Peso 6)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0.0 a 10.0"
                      value={editForm.activityN1}
                      onChange={(e) => setEditForm({ ...editForm, activityN1: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Avaliação N1 <span className="text-indigo-400">(Peso 4)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0.0 a 10.0"
                      value={editForm.examN1}
                      onChange={(e) => setEditForm({ ...editForm, examN1: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Etapa N2 */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Etapa N2</span>
                  <span className="text-xs text-slate-400 font-mono">
                    Média N2: <strong className="text-white">{modalLiveCalc.mediaN2 !== null ? modalLiveCalc.mediaN2 : '—'}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Atividade N2 <span className="text-indigo-400">(Peso 4)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0.0 a 10.0"
                      value={editForm.activityN2}
                      onChange={(e) => setEditForm({ ...editForm, activityN2: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Avaliação N2 <span className="text-indigo-400">(Peso 6)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0.0 a 10.0"
                      value={editForm.examN2}
                      onChange={(e) => setEditForm({ ...editForm, examN2: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Frequência do Aluno: <strong className="text-white">{modalLiveCalc.presencePercentage}%</strong></span>
                  <div className="mt-0.5">
                    {modalLiveCalc.hasBonus ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Bônus de +0,5 ponto aplicado!
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Sem bônus (Requer 6,5 a 6,9 e freq &ge; 75%)</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Média Final</span>
                  <span className="text-xl font-black text-white font-mono">
                    {modalLiveCalc.mediaFinal !== null ? modalLiveCalc.mediaFinal : '—'}
                  </span>
                  <div className="mt-1">{renderStatusBadge(modalLiveCalc.status)}</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-grade-modal"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Notas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
