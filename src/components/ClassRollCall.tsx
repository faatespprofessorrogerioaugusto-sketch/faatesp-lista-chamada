import React, { useState, useEffect } from 'react';
import { Student, ClassSession, AttendanceStatus, StudentLoginRecord } from '../types';
import { loadStudentLogins } from '../utils/storage';
import { CheckCircle2, XCircle, AlertCircle, Save, Calendar, BookOpen, User, Sparkles, Clock, Check, PlusCircle, Layers, Users, Zap } from 'lucide-react';

interface ClassRollCallProps {
  students: Student[];
  existingClasses: ClassSession[];
  editingClassId?: string | null;
  onSaveClass: (session: ClassSession) => void;
  onCancelEdit?: () => void;
}

export const ClassRollCall: React.FC<ClassRollCallProps> = ({
  students,
  existingClasses,
  editingClassId,
  onSaveClass,
  onCancelEdit,
}) => {
  // Sort classes by classNumber
  const sortedClasses = [...existingClasses].sort((a, b) => a.classNumber - b.classNumber);

  // Automatically sort students in alphabetical order (A-Z)
  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Active selected session ID in view ('new' or specific class id)
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (editingClassId) return editingClassId;
    if (sortedClasses.length > 0) return sortedClasses[0].id;
    return 'new';
  });

  // Next available class number
  const nextClassNum = sortedClasses.length > 0
    ? Math.max(...sortedClasses.map((c) => c.classNumber)) + 1
    : 1;

  // Schedule & 90% Attendance Threshold State
  const [startTime, setStartTime] = useState<string>('19:00');
  const [endTime, setEndTime] = useState<string>('21:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(150);

  // Form State
  const [classNumber, setClassNumber] = useState<number>(1);
  const [date, setDate] = useState<string>('2026-08-10');
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instructor, setInstructor] = useState<string>('Professor Rogério Augusto Fernandes');

  // Attendance Records: studentId -> status
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [recordNotes, setRecordNotes] = useState<Record<string, string>>({});

  // Student Logins Tracking & Confrontation
  const [studentLogins, setStudentLogins] = useState<Record<string, StudentLoginRecord>>({});
  const [confrontFeedback, setConfrontFeedback] = useState<string | null>(null);

  // Save State & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Load student logins on mount or when active class changes
  useEffect(() => {
    const logins = loadStudentLogins();
    setStudentLogins(logins);
  }, [selectedClassId]);

  // Calculate 90% required presence minutes dynamically
  const minRequiredMinutes = Math.round((durationMinutes * 90) / 100);

  // Helper to recalculate duration when start or end time changes
  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);

    if (newStart && newEnd) {
      const [h1, m1] = newStart.split(':').map(Number);
      const [h2, m2] = newEnd.split(':').map(Number);
      if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
        const startMins = h1 * 60 + m1;
        const endMins = h2 * 60 + m2;
        if (endMins > startMins) {
          setDurationMinutes(endMins - startMins);
        }
      }
    }
  };

  // Sync with editingClassId prop if passed
  useEffect(() => {
    if (editingClassId) {
      setSelectedClassId(editingClassId);
    }
  }, [editingClassId]);

  // Load session data whenever selectedClassId or sortedClasses change
  useEffect(() => {
    const currentLogins = loadStudentLogins();
    setStudentLogins(currentLogins);

    if (selectedClassId === 'new') {
      // Setup clean form for the next class (e.g. Aula #2)
      setClassNumber(nextClassNum);
      setDate(nextClassNum === 2 ? '2026-08-18' : new Date().toISOString().slice(0, 10));
      setStartTime('19:00');
      setEndTime('21:30');
      setDurationMinutes(150);
      setTopic(getDefaultTopicForClass(nextClassNum));
      setDescription(`Registro de presença da Aula #${nextClassNum} de Consultoria Organizacional.`);
      setInstructor('Professor Rogério Augusto Fernandes');

      // Confront registered students with logins:
      // Students who logged in -> 'present', Students who didn't log in -> 'absent'
      const initialRecs: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initialRecs[s.id] = currentLogins[s.id] ? 'present' : 'absent';
      });
      setRecords(initialRecs);
      setRecordNotes({});
      return;
    }

    // Load existing class
    const targetClass = sortedClasses.find((c) => c.id === selectedClassId) || sortedClasses[0];
    if (targetClass) {
      setClassNumber(targetClass.classNumber);
      setDate(targetClass.date);
      setStartTime(targetClass.startTime || '19:00');
      setEndTime(targetClass.endTime || '21:30');
      setDurationMinutes(targetClass.durationMinutes || 150);
      setTopic(targetClass.topic || getDefaultTopicForClass(targetClass.classNumber));
      setDescription(targetClass.description || '');
      setInstructor(targetClass.instructor || 'Professor Rogério Augusto Fernandes');

      // Merge students with saved records
      const currentRecs = { ...(targetClass.records || {}) };
      students.forEach((s) => {
        if (!currentRecs[s.id]) {
          // If no record exists yet, check if student logged in
          currentRecs[s.id] = currentLogins[s.id] ? 'present' : 'absent';
        }
      });
      setRecords(currentRecs);
      setRecordNotes(targetClass.recordNotes || {});
    }
  }, [selectedClassId, existingClasses, students]);

  // Check for duplicate date/class number
  useEffect(() => {
    if (selectedClassId === 'new') {
      const conflict = sortedClasses.find((c) => c.classNumber === Number(classNumber) || c.date === date);
      if (conflict) {
        setDuplicateWarning(
          `Aviso: Já existe a Aula #${conflict.classNumber} cadastrada no dia ${formatDateDisplay(conflict.date)} ("${conflict.topic}"). Ao salvar, você estará atualizando esse encontro.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      const conflict = sortedClasses.find(
        (c) => c.id !== selectedClassId && (c.classNumber === Number(classNumber) || (c.date === date && c.classNumber !== Number(classNumber)))
      );
      if (conflict) {
        setDuplicateWarning(
          `Atenção: A Aula #${conflict.classNumber} já possui este número ou data (${formatDateDisplay(conflict.date)}).`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [classNumber, date, sortedClasses, selectedClassId]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecordNotes((prev) => ({ ...prev, [studentId]: note }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newRecs: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      newRecs[s.id] = status;
    });
    setRecords(newRecs);
  };

  // Confrontation: Cross-reference registered students with system logins
  const handleConfrontLogins = () => {
    const currentLogins = loadStudentLogins();
    setStudentLogins(currentLogins);
    const newRecs: Record<string, AttendanceStatus> = {};
    let loggedInCount = 0;
    let absentCountCalc = 0;

    students.forEach((s) => {
      if (currentLogins[s.id]) {
        newRecs[s.id] = 'present';
        loggedInCount++;
      } else {
        newRecs[s.id] = 'absent';
        absentCountCalc++;
      }
    });

    setRecords(newRecs);
    setConfrontFeedback(
      `Confronto realizado com sucesso! ${loggedInCount} aluno(s) com login marcados como Presentes e ${absentCountCalc} aluno(s) sem login definidos automaticamente como Ausentes.`
    );

    setTimeout(() => {
      setConfrontFeedback(null);
    }, 6000);
  };

  // Calculate live counts
  const presentCount = Object.values(records).filter((s) => s === 'present').length;
  const absentCount = Object.values(records).filter((s) => s === 'absent').length;
  const justifiedCount = Object.values(records).filter((s) => s === 'justified').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      alert('Por favor, informe o Tema ou Módulo da aula.');
      return;
    }

    setIsSaving(true);

    const existingClass = sortedClasses.find((c) => c.id === selectedClassId || c.classNumber === Number(classNumber));
    const targetId = existingClass ? existingClass.id : (selectedClassId !== 'new' ? selectedClassId : `class-${Date.now()}`);

    const newSession: ClassSession = {
      id: targetId,
      classNumber: Number(classNumber),
      date,
      startTime,
      endTime,
      durationMinutes,
      minRequiredMinutes,
      topic: topic.trim(),
      description: description.trim(),
      instructor: instructor.trim(),
      records,
      recordNotes,
      isClosed: true,
      createdAt: existingClass?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveClass(newSession);
    setSelectedClassId(targetId);
    setIsSaving(false);
    setSavedSuccess(true);
    setSaveSuccessMessage(
      `Chamada da Aula #${classNumber} salva com sucesso! (${formatDateDisplay(date)} • ${presentCount} Presentes, ${absentCount} Ausentes, ${justifiedCount} Justificados)`
    );

    setTimeout(() => {
      setSavedSuccess(false);
      setSaveSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Class Selector Tabs */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Aulas Cadastradas:</span>
          </span>

          {sortedClasses.map((cls) => {
            const isSelected = selectedClassId === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClassId(cls.id);
                  setSavedSuccess(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>Aula #{cls.classNumber}</span>
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-400'}`}>
                  {formatDateDisplay(cls.date)}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setSelectedClassId('new');
              setSavedSuccess(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedClassId === 'new'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800/80 hover:bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>+ Nova Chamada (Aula #{nextClassNum})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            type="submit"
            form="class-rollcall-form"
            id="header-save-rollcall-btn"
            disabled={isSaving}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              savedSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
            title="Salvar todas as alterações de chamada e horários da aula"
          >
            {isSaving ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Dados Alterados</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              {selectedClassId === 'new' ? `Criando Nova Aula #${classNumber}` : `Editando Chamada da Aula #${classNumber}`}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Consultoria Organizacional • Data: {formatDateDisplay(date)}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-1">
            {selectedClassId === 'new' ? `Lançamento de Chamada - Aula #${classNumber}` : `Aula #${classNumber} - ${topic || 'Consultoria Organizacional'}`}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Preencha a data e marque a presença, falta ou justificativa dos {students.length} alunos cadastrados.
          </p>
        </div>
      </div>

      {/* Duplicate / Existing Class Warning Alert */}
      {duplicateWarning && (
        <div className="bg-amber-950/50 border border-amber-800/80 text-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{duplicateWarning}</p>
        </div>
      )}

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-emerald-200">Chamada da Aula #{classNumber} Salva com Sucesso!</h4>
              <p className="text-xs text-emerald-300/80">
                A data ({formatDateDisplay(date)}), horário ({startTime} às {endTime}) e as presenças foram salvas e sincronizadas no sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      <form id="class-rollcall-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Class Metadata Section */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Dados da Aula e Conteúdo</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Number */}
            <div>
              <label htmlFor="class-number-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Número da Aula <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                id="class-number-input"
                required
                value={classNumber}
                onChange={(e) => setClassNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-100"
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="class-date-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Data do Encontro <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                id="class-date-input"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100"
              />
            </div>

            {/* Instructor */}
            <div className="lg:col-span-2">
              <label htmlFor="class-instructor-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Professor
              </label>
              <input
                type="text"
                id="class-instructor-input"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Professor Rogério Augusto Fernandes"
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100 placeholder-slate-500"
              />
            </div>

            {/* Topic / Module */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="class-topic-input" className="block text-xs font-semibold text-slate-300 mb-1">
                Tema / Módulo da Aula <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="class-topic-input"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Mapeamento de Processos e Diagnóstico Organizacional"
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Schedule & 90% Presence Calculation Section */}
          <div className="bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-700/60 space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Horário da Aula e Cálculo da Regra de 90% de Permanência</span>
              </h4>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400 mr-1 font-medium">Atalhos de Duração:</span>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '19:30');
                    setDurationMinutes(30);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 30
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  30 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '19:45');
                    setDurationMinutes(45);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 45
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  45 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '20:00');
                    setDurationMinutes(60);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 60
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  60 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '21:00');
                    setDurationMinutes(120);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 120
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  120 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '21:15');
                    setDurationMinutes(135);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 135
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  135 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleTimeChange('19:00', '21:30');
                    setDurationMinutes(150);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    durationMinutes === 150
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  150 min (Padrão)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Start Time */}
              <div>
                <label htmlFor="class-start-time" className="block text-xs font-semibold text-slate-300 mb-1">
                  Horário de Início
                </label>
                <input
                  type="time"
                  id="class-start-time"
                  value={startTime}
                  onChange={(e) => handleTimeChange(e.target.value, endTime)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-100"
                />
              </div>

              {/* End Time - Fully Editable for early endings */}
              <div>
                <label htmlFor="class-end-time" className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Horário de Término</span>
                  <span className="text-[10px] text-amber-400 font-normal">Editável se terminar antes</span>
                </label>
                <input
                  type="time"
                  id="class-end-time"
                  value={endTime}
                  onChange={(e) => handleTimeChange(startTime, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-amber-500/50 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-100"
                />
              </div>

              {/* Duration Minutes */}
              <div>
                <label htmlFor="class-duration-mins" className="block text-xs font-semibold text-slate-300 mb-1">
                  Duração Total (Minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  id="class-duration-mins"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-100"
                />
              </div>

              {/* Calculated 90% Threshold */}
              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Permanência Exigida (90%)
                </label>
                <div className="w-full px-3 py-2 text-sm bg-emerald-950/60 border border-emerald-700/60 rounded-xl font-black text-emerald-300 flex items-center justify-between">
                  <span>{minRequiredMinutes} minutos</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
                    90% Mínimo
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> Para esta aula de <strong>{durationMinutes} minutos</strong> ({startTime} às {endTime}), o aluno precisa ter no mínimo <strong>{minRequiredMinutes} minutos de permanência</strong> no Google Meet para receber a marcação de <strong>Presença (P)</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Counter & Quick Actions Bar */}
        <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-lg flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center lg:text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Alunos
              </span>
              <span className="text-xl font-extrabold text-white">{students.length}</span>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-4">
              <div className="bg-emerald-950/80 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Presentes (P)</span>
                <span className="text-lg font-black text-emerald-300">{presentCount}</span>
              </div>

              <div className="bg-rose-950/80 border border-rose-800/60 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Ausentes (A)</span>
                <span className="text-lg font-black text-rose-300">{absentCount}</span>
              </div>

              <div className="bg-amber-950/80 border border-amber-800/60 px-3 py-1.5 rounded-xl text-center">
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Justificados (J)</span>
                <span className="text-lg font-black text-amber-300">{justifiedCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Mark & Confrontation Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
            {/* CONFRONTATION BUTTON */}
            <button
              type="button"
              onClick={handleConfrontLogins}
              id="confront-logins-btn"
              className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              title="Confrontar alunos com o login: alunos com login ficam presentes e quem não entrou fica ausente"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Confrontar Logins (Ausentes Automáticos)</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              id="mark-all-present-btn"
              className="px-3 py-2 text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Todos Presentes</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              id="mark-all-absent-btn"
              className="px-3 py-2 text-xs font-semibold bg-rose-700/80 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Todos Ausentes</span>
            </button>
          </div>
        </div>

        {/* Confrontation Feedback Notification */}
        {confrontFeedback && (
          <div className="p-4 bg-indigo-950/90 border border-indigo-700 rounded-2xl text-indigo-200 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-lg">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
            <span>{confrontFeedback}</span>
          </div>
        )}

        {/* Student List Roll Call Table */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <User className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">
                Lista de Alunos - Marcação de Presença
              </h3>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                Ordem Alfabética (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {Object.keys(studentLogins).length} com login
              </span>
              <span>Total: {sortedStudents.length} alunos</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {sortedStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhum aluno cadastrado no sistema. Adicione alunos na aba "Gestão de Alunos".
              </div>
            ) : (
              sortedStudents.map((student, idx) => {
                const currentStatus = records[student.id] || 'present';
                const currentNote = recordNotes[student.id] || '';
                const isLogged = !!studentLogins[student.id];
                const loginData = studentLogins[student.id];

                return (
                  <div
                    key={student.id}
                    className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      currentStatus === 'present'
                        ? 'hover:bg-slate-800/40'
                        : currentStatus === 'absent'
                        ? 'bg-rose-950/20'
                        : 'bg-amber-950/20'
                    }`}
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-500 w-6 text-right">
                        {idx + 1}.
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-100 text-sm">{student.name}</span>
                          {isLogged ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Fez Login {loginData?.loginTime ? `(${loginData.loginTime})` : ''}
                            </span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Sem Login (Ausente)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {student.registrationId ? `Matrícula: ${student.registrationId}` : 'Sem matrícula'}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Radio Group */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                      <div className="inline-flex rounded-xl p-1 bg-slate-800 border border-slate-700">
                        {/* PRESENTE */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          id={`status-present-${student.id}`}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Presente</span>
                        </button>

                        {/* AUSENTE */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          id={`status-absent-${student.id}`}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Ausente</span>
                        </button>

                        {/* JUSTIFICADO */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'justified')}
                          id={`status-justified-${student.id}`}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            currentStatus === 'justified'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Justificado</span>
                        </button>
                      </div>

                      {/* Optional Note input for absence or justification */}
                      {(currentStatus === 'absent' || currentStatus === 'justified') && (
                        <input
                          type="text"
                          placeholder="Motivo / Observação (opcional)..."
                          value={currentNote}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          id={`note-input-${student.id}`}
                          className="w-full sm:w-60 text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submit Form Button and Inline Feedback */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left w-full sm:w-auto">
            {savedSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{saveSuccessMessage || `Chamada da Aula #${classNumber} salva com sucesso!`}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Clique no botão para salvar a data, horários, tema e a chamada de todos os alunos.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="submit"
              id="save-rollcall-btn"
              disabled={isSaving}
              className={`w-full sm:w-auto px-6 py-3 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isSaving ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Salvando Registro...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>✓ Registro de Chamada Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Registro de Chamada</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

function getDefaultTopicForClass(num: number): string {
  const topics: Record<number, string> = {
    1: 'Introdução à Consultoria Organizacional e Papel do Consultor',
    2: 'Diagnóstico Organizacional e Coleta de Dados',
    3: 'Mapeamento de Processos e Análise SWOT Aplicada',
    4: 'Gestão da Mudança e Cultura Organizacional',
    5: 'Design Thinking e Resolução Criativa de Problemas em Empresas',
    6: 'Elaboração de Propostas Comerciais de Consultoria',
    7: 'Apresentação de Projetos e Feedback para Clientes Executivos',
    8: 'Avaliação Final de Projetos de Consultoria',
  };
  return topics[num] || `Módulo Avançado de Consultoria #${num}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
