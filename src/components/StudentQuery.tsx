import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { getStudentStats } from '../utils/storage';
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  AlertTriangle,
  Calendar,
  BookOpen,
  Copy,
  Check,
  Mail,
  FileText
} from 'lucide-react';

interface StudentQueryProps {
  students: Student[];
  classes: ClassSession[];
  selectedStudentId?: string | null;
  onSelectStudent: (studentId: string) => void;
  onUpdateRecordStatus?: (classId: string, studentId: string, status: 'present' | 'absent' | 'justified') => void;
}

export const StudentQuery: React.FC<StudentQueryProps> = ({
  students,
  classes,
  selectedStudentId,
  onSelectStudent,
  onUpdateRecordStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter student candidates (sorted alphabetically A-Z)
  const filteredStudents = [...students]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.registrationId && s.registrationId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Active student selection
  const currentStudent = students.find((s) => s.id === selectedStudentId) || (filteredStudents.length > 0 ? filteredStudents[0] : null);

  const stats = currentStudent ? getStudentStats(currentStudent, classes) : null;

  // Sort classes chronologically
  const sortedClasses = [...classes].sort((a, b) => a.classNumber - b.classNumber);

  const handleCopySummary = () => {
    if (!currentStudent || !stats) return;
    const text = `*Relatório de Frequência - Disciplina: Consultoria Organizacional*\n\n` +
      `Aluno: ${currentStudent.name}\n` +
      `Matrícula: ${currentStudent.registrationId || 'N/A'}\n` +
      `Aulas Ministradas: ${stats.totalClasses}\n` +
      `Presenças: ${stats.presences}\n` +
      `Ausências: ${stats.absences}\n` +
      `Justificadas: ${stats.justified}\n` +
      `Frequência: ${stats.presencePercentage}%\n` +
      `Situação: ${stats.presencePercentage >= 75 ? 'Aprovado por Frequência (≥75%)' : 'Risco de Infrequência (<75%)'}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Search and Selection Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <span>Consulta de Frequência por Aluno</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Pesquise um aluno para visualizar o histórico detalhado de presenças e ausências.
          </p>
        </div>

        {/* Search Bar & Dropdown Select */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o nome do aluno ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="student-search-input"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100 placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={currentStudent?.id || ''}
              onChange={(e) => onSelectStudent(e.target.value)}
              id="select-student-dropdown"
              className="w-full py-2 px-3 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-100 cursor-pointer"
            >
              <option value="" disabled>Selecione um aluno da lista...</option>
              {filteredStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.registrationId ? `(${st.registrationId})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Profile Card & Attendance Breakdown */}
      {currentStudent && stats ? (
        <div className="space-y-6">
          {/* Student Profile Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 p-3.5 rounded-2xl shrink-0">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-black text-white tracking-tight">{currentStudent.name}</h3>
                    {currentStudent.registrationId && (
                      <span className="bg-indigo-900/80 text-indigo-200 border border-indigo-700/60 text-xs font-mono px-2.5 py-0.5 rounded-full">
                        Matrícula: {currentStudent.registrationId}
                      </span>
                    )}
                  </div>
                  {currentStudent.email && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs mt-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{currentStudent.email}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Disciplina de Consultoria Organizacional • Ano Letivo 2026/2
                  </p>
                </div>
              </div>

              {/* Attendance Status Badge & Copy Action */}
              <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                {stats.presencePercentage >= 75 ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold">
                    <Award className="w-4 h-4" />
                    <span>Aprovado por Frequência ({stats.presencePercentage}%)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Risco de Reprovação ({stats.presencePercentage}%)</span>
                  </span>
                )}

                <button
                  onClick={handleCopySummary}
                  id="copy-student-summary-btn"
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copiado para Área de Transferência!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Resumo para Envio</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Attendance Progress Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Percentual de Frequência Acumulada</span>
                <span
                  className={`font-extrabold text-sm ${
                    stats.presencePercentage >= 75 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {stats.presencePercentage}% de presenças
                </span>
              </div>
              <div className="relative w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                {/* 75% Threshold marker line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                  style={{ left: '75%' }}
                  title="Limite de 75% mínimo de frequência"
                />
                <div
                  className={`h-full transition-all duration-700 ${
                    stats.presencePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${stats.presencePercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 text-right">
                Linha amarela indica o mínimo acadêmico exigido de 75%
              </p>
            </div>
          </div>

          {/* Indicator KPI Cards for Student */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Total de Aulas</span>
              <span className="text-2xl font-black text-slate-100 mt-1 block">{stats.totalClasses}</span>
              <span className="text-[10px] text-slate-500">Ministradas até hoje</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Presenças</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.presences}</span>
              <span className="text-[10px] text-emerald-400/80">Comparações em sala</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Ausências (Faltas)</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">{stats.absences}</span>
              <span className="text-[10px] text-rose-400/80">Não justificadas</span>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-medium block">Faltas Justificadas</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.justified}</span>
              <span className="text-[10px] text-amber-400/80">Com atestado / viagem</span>
            </div>
          </div>

          {/* Detailed Attendance History Table per Class */}
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Histórico de Presença Aula a Aula</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {sortedClasses.length} encontros
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3">Aula / Data</th>
                    <th className="p-3">Tema da Aula</th>
                    <th className="p-3 text-center">Status do Aluno</th>
                    <th className="p-3">Observações do Registro</th>
                    {onUpdateRecordStatus && <th className="p-3 text-right">Ação Rápida</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sortedClasses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                        Nenhuma aula cadastrada ainda.
                      </td>
                    </tr>
                  ) : (
                    sortedClasses.map((cls) => {
                      const status = cls.records[currentStudent.id] || 'present';
                      const note = cls.recordNotes?.[currentStudent.id] || '';

                      return (
                        <tr key={cls.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-indigo-400">Aula #{cls.classNumber}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {formatDateDisplay(cls.date)}
                            </div>
                          </td>

                          <td className="p-3 max-w-xs">
                            <div className="font-bold text-slate-200">{cleanTopic(cls.topic)}</div>
                            {cls.description && (
                              <div className="text-[11px] text-slate-400 line-clamp-1">{cls.description}</div>
                            )}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {status === 'present' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Presente
                              </span>
                            )}
                            {status === 'absent' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                Ausente
                              </span>
                            )}
                            {status === 'justified' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Justificado
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {note ? (
                              <span className="text-slate-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 italic">
                                "{note}"
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {onUpdateRecordStatus && (
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
                                <button
                                  onClick={() => onUpdateRecordStatus(cls.id, currentStudent.id, 'present')}
                                  title="Marcar Presente"
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                    status === 'present' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  onClick={() => onUpdateRecordStatus(cls.id, currentStudent.id, 'absent')}
                                  title="Marcar Ausente"
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                    status === 'absent' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => onUpdateRecordStatus(cls.id, currentStudent.id, 'justified')}
                                  title="Marcar Justificado"
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                    status === 'justified' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  J
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
          Nenhum aluno encontrado para a consulta.
        </div>
      )}
    </div>
  );
};

function cleanTopic(topicStr: string): string {
  if (!topicStr) return '';
  // Removes "Aula #1 - ", "Aula 1 - ", "Aula #1: ", etc. from the beginning
  return topicStr.replace(/^Aula\s*(?:#?\d+)\s*[-:–—]\s*/i, '').trim();
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
