import React, { useState } from 'react';
import { ClassSession, AttendanceStatus } from '../types';
import { CheckCircle2, Calendar, BookOpen, Clock, User, Award, Check } from 'lucide-react';

interface StudentRollCallProps {
  studentName: string;
  studentId: string;
  classes: ClassSession[];
  onUpdateAttendance: (classId: string, studentId: string, status: AttendanceStatus) => void;
}

export const StudentRollCall: React.FC<StudentRollCallProps> = ({
  studentName,
  studentId,
  classes,
  onUpdateAttendance,
}) => {
  const [successClassId, setSuccessClassId] = useState<string | null>(null);

  // Sort classes descending by class number or date (latest first)
  const sortedClasses = [...classes].sort((a, b) => b.classNumber - a.classNumber);

  // Find latest class session or selected class
  const [selectedClassId, setSelectedClassId] = useState<string>(
    sortedClasses[0]?.id || ''
  );

  const activeClass = sortedClasses.find((c) => c.id === selectedClassId) || sortedClasses[0];

  const handleRegisterPresence = (classId: string) => {
    onUpdateAttendance(classId, studentId, 'present');
    setSuccessClassId(classId);

    setTimeout(() => {
      setSuccessClassId(null);
    }, 4000);
  };

  // Student Statistics
  const totalClasses = sortedClasses.length;
  const attendedClasses = sortedClasses.filter(
    (c) => c.records[studentId] === 'present' || c.records[studentId] === 'justified'
  ).length;

  const presencePercent = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Área do Aluno
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Disciplina: Consultoria Organizacional</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-1">
            Olá, <span className="text-indigo-400">{studentName}</span>!
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Registre sua presença nos encontros do curso e acompanhe seu índice de frequência.
          </p>
        </div>

        {/* Student Stats Pill */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Frequência</span>
            <span className="text-xl font-black text-emerald-400">{presencePercent}%</span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Presenças</span>
            <span className="text-xl font-extrabold text-slate-100">
              {attendedClasses}/{totalClasses}
            </span>
          </div>
        </div>
      </div>

      {sortedClasses.length === 0 ? (
        <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Nenhuma Aula Cadastrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Assim que o professor cadastrar e iniciar o encontro no sistema, a opção para registrar presença aparecerá aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          {/* Class Selection Dropdown if multiple classes */}
          {sortedClasses.length > 1 && (
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <label htmlFor="student-class-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Selecione a Aula para Confirmar Presença:</span>
              </label>
              <select
                id="student-class-select"
                value={activeClass?.id || ''}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full sm:w-80 py-2 px-3 text-xs bg-slate-800 border border-slate-700 text-slate-100 font-bold rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {sortedClasses.map((c) => {
                  const isPresent = c.records[studentId] === 'present';
                  return (
                    <option key={c.id} value={c.id}>
                      Aula #{c.classNumber} ({formatDateDisplay(c.date)}) - {isPresent ? '✓ Presente' : 'Pendente'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Active Class Card */}
          {activeClass && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-hidden space-y-6 p-6">
              {/* Class Auto-Filled Details */}
              <div className="space-y-3 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-extrabold px-3 py-1 rounded-lg">
                    Aula #{activeClass.classNumber}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data: {formatDateDisplay(activeClass.date)}
                  </span>
                  {activeClass.instructor && (
                    <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {activeClass.instructor}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{activeClass.topic}</h3>
                  {activeClass.description && (
                    <p className="text-xs text-slate-400 mt-1">{activeClass.description}</p>
                  )}
                </div>
              </div>

              {/* Attendance Action Section */}
              {successClassId === activeClass.id && (
                <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-200">Presença Registrada com Sucesso!</h4>
                    <p className="text-xs text-emerald-300/80">
                      Sua presença para a Aula #{activeClass.classNumber} foi salva no sistema e lançada na matriz de chamada.
                    </p>
                  </div>
                </div>
              )}

              {/* Status and Big Registration Button */}
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Seu Status nesta Aula
                  </span>
                  {activeClass.records[studentId] === 'present' ? (
                    <div className="inline-flex items-center gap-2 text-emerald-400 font-extrabold text-base bg-emerald-500/10 px-3.5 py-1 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Presença Confirmada</span>
                    </div>
                  ) : activeClass.records[studentId] === 'justified' ? (
                    <div className="inline-flex items-center gap-2 text-amber-400 font-extrabold text-base bg-amber-500/10 px-3.5 py-1 rounded-xl border border-amber-500/30">
                      <Award className="w-5 h-5" />
                      <span>Falta Justificada</span>
                    </div>
                  ) : activeClass.records[studentId] === 'absent' ? (
                    <div className="inline-flex items-center gap-2 text-rose-400 font-extrabold text-base bg-rose-500/10 px-3.5 py-1 rounded-xl border border-rose-500/30">
                      <span>Ausência Registrada</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-slate-400 font-medium text-sm">
                      <span>Pendente de confirmação</span>
                    </div>
                  )}
                </div>

                {/* Only Button: Registrar Presença */}
                <button
                  type="button"
                  onClick={() => handleRegisterPresence(activeClass.id)}
                  id={`student-register-presence-btn-${activeClass.id}`}
                  className={`px-8 py-4 text-base font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer w-full sm:w-auto ${
                    activeClass.records[studentId] === 'present'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 animate-pulse'
                  }`}
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>
                    {activeClass.records[studentId] === 'present'
                      ? 'Confirmar Presença Novamente'
                      : 'Registrar Presença'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* History List of All Classes for Student */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Histórico Completo de Encontros do Curso</span>
            </h3>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
              {sortedClasses.map((cls) => {
                const isPresent = cls.records[studentId] === 'present';
                const isJustified = cls.records[studentId] === 'justified';
                const isAbsent = cls.records[studentId] === 'absent';

                return (
                  <div
                    key={cls.id}
                    className="p-4 bg-slate-900/40 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400 text-sm">
                          Aula #{cls.classNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          • {formatDateDisplay(cls.date)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5">{cls.topic}</div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {isPresent ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Presente
                        </span>
                      ) : isJustified ? (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                          Justificado
                        </span>
                      ) : isAbsent ? (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                          Ausente
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                          Pendente
                        </span>
                      )}

                      {!isPresent && (
                        <button
                          onClick={() => handleRegisterPresence(cls.id)}
                          className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          Registrar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
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
