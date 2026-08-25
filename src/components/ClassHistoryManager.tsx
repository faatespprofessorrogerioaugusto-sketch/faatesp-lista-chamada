import React, { useState } from 'react';
import { ClassSession, Student } from '../types';
import { BookOpen, Calendar, Edit3, Trash2, CheckCircle2, XCircle, AlertCircle, PlusCircle, Users } from 'lucide-react';

interface ClassHistoryManagerProps {
  classes: ClassSession[];
  students: Student[];
  onEditClass: (classId: string) => void;
  onDeleteClass: (classId: string) => void;
  onNavigateToNewRollCall: () => void;
}

export const ClassHistoryManager: React.FC<ClassHistoryManagerProps> = ({
  classes,
  students,
  onEditClass,
  onDeleteClass,
  onNavigateToNewRollCall,
}) => {
  const [classToDelete, setClassToDelete] = useState<ClassSession | null>(null);
  const sortedClasses = [...classes].sort((a, b) => b.classNumber - a.classNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Aulas Realizadas e Histórico de Registros</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Gerencie as chamadas de todas as aulas ministradas no curso de Consultoria Organizacional.
          </p>
        </div>

        <button
          onClick={onNavigateToNewRollCall}
          id="class-history-new-rollcall-btn"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Nova Chamada</span>
        </button>
      </div>

      {/* Class Sessions List */}
      <div className="space-y-4">
        {sortedClasses.length === 0 ? (
          <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center text-slate-500">
            Nenhuma aula cadastrada ainda. Clique no botão acima para registrar a primeira chamada!
          </div>
        ) : (
          sortedClasses.map((cls) => {
            let pCount = 0;
            let aCount = 0;
            let jCount = 0;

            Object.values(cls.records).forEach((st) => {
              if (st === 'present') pCount++;
              else if (st === 'absent') aCount++;
              else if (st === 'justified') jCount++;
            });

            const total = students.length;
            const presenceRate = total > 0 ? Math.round(((pCount + jCount) / total) * 100) : 0;

            return (
              <div
                key={cls.id}
                className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold text-xs px-2.5 py-0.5 rounded-md">
                      Aula #{cls.classNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {formatDateDisplay(cls.date)}
                    </span>
                    {cls.instructor && (
                      <span className="text-xs text-slate-400">
                        • Professor: <strong className="text-slate-300">{cls.instructor}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-100 text-base">{cls.topic}</h3>
                  {cls.description && <p className="text-xs text-slate-400">{cls.description}</p>}
                </div>

                {/* Metrics & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  {/* Attendance Pill Stats */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Presentes</span>
                      <span className="font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {pCount}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Ausentes</span>
                      <span className="font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        {aCount}
                      </span>
                    </div>

                    {jCount > 0 && (
                      <div className="text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Justif.</span>
                        <span className="font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          {jCount}
                        </span>
                      </div>
                    )}

                    <div className="text-center border-l border-slate-800 pl-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">% Freq.</span>
                      <span className="font-black text-indigo-400">{presenceRate}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEditClass(cls.id)}
                      id={`edit-class-btn-${cls.id}`}
                      className="p-2 text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                      title="Editar chamada desta aula"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setClassToDelete(cls)}
                      id={`delete-class-btn-${cls.id}`}
                      className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/60"
                      title="Excluir aula"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Class Deletion */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Excluir Aula #{classToDelete.classNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Tem certeza que deseja excluir o registro de chamada da <strong className="text-slate-200">Aula #{classToDelete.classNumber} ({formatDateDisplay(classToDelete.date)})</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
              Esta ação removerá todos os registros de presença/falta computados para esta data específica.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                id="cancel-delete-class-btn"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (classToDelete) {
                    onDeleteClass(classToDelete.id);
                    setClassToDelete(null);
                  }
                }}
                id="confirm-delete-class-btn"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Sim, Excluir Aula
              </button>
            </div>
          </div>
        </div>
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
