import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { getStudentStats } from '../utils/storage';
import { formatToTitleCase } from '../utils/formatters';
import { Users, UserPlus, Edit3, Trash2, Search, Upload, Mail, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  classes: ClassSession[];
  activeClassId?: string | null;
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenImportModal: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  classes,
  activeClassId,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine which class is currently active/selected
  const sortedClasses = [...classes].sort((a, b) => a.classNumber - b.classNumber);
  const activeClass = activeClassId
    ? classes.find((c) => c.id === activeClassId) || sortedClasses[sortedClasses.length - 1]
    : sortedClasses.length > 0
    ? sortedClasses[sortedClasses.length - 1]
    : null;

  const currentClassLabel = activeClass ? `Aula #${activeClass.classNumber}` : 'Aula #1';

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [name, setName] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [email, setEmail] = useState('');

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setRegistrationId(`2026${String(students.length + 1).padStart(3, '0')}`);
    setEmail('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setRegistrationId(student.registrationId || '');
    setEmail(student.email || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedName = formatToTitleCase(name.trim());

    if (editingStudent) {
      onEditStudent({
        ...editingStudent,
        name: formattedName,
        registrationId: registrationId.trim(),
        email: email.trim().toLowerCase(),
      });
    } else {
      onAddStudent({
        name: formattedName,
        registrationId: registrationId.trim(),
        email: email.trim().toLowerCase(),
      });
    }

    setIsFormOpen(false);
  };

  const filtered = [...students]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
    .filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.registrationId && s.registrationId.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Gestão de Alunos</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Cadastre novos alunos, edite informações ou importe da planilha Excel. Total de {students.length} matriculados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportModal}
            id="students-import-excel-btn"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Importar de Planilha</span>
          </button>

          <button
            onClick={handleOpenAdd}
            id="add-new-student-btn"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Informative Banner showing strictly Current Class */}
      <div className="bg-slate-900/90 border border-indigo-900/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold rounded-lg uppercase tracking-wide text-[11px]">
            Informação da Disciplina
          </span>
          <span className="text-white font-bold text-sm tracking-wide">
            {currentClassLabel}
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px] shrink-0">
          Total de aulas cadastradas: <strong className="text-indigo-400">{classes.length}</strong>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 animate-scale-up space-y-4 text-slate-100">
            <h3 className="text-lg font-bold text-slate-100">
              {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs" autoComplete="off">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome Completo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={name}
                  onChange={(e) => setName(formatToTitleCase(e.target.value))}
                  placeholder="Ex: Neymar da Silva Júnior"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Número de Matrícula</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  placeholder="Ex: 2026011"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">E-mail do Aluno</label>
                <input
                  type="email"
                  autoComplete="off"
                  spellCheck={false}
                  data-lpignore="true"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: aluno@universidade.edu.br"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-300 bg-slate-800 hover:bg-slate-700 font-semibold rounded-lg cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Table */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por aluno ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            />
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Exibindo {filtered.length} de {students.length} alunos
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">Matrícula</th>
                <th className="p-3">Nome Completo</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 text-center">Frequência Atual</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((st) => {
                const stats = getStudentStats(st, classes);
                return (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400 font-bold">
                      {st.registrationId || '-'}
                    </td>
                    <td className="p-3 font-bold text-slate-100">{st.name}</td>
                    <td className="p-3 text-slate-400">{st.email || '-'}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full border ${
                          stats.presencePercentage >= 75
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {stats.presencePercentage}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          id={`edit-student-btn-${st.id}`}
                          className="p-1.5 text-indigo-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Editar aluno"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(st)}
                          id={`delete-student-btn-${st.id}`}
                          className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Student Deletion (Avoids iframe window.confirm block) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Excluir Aluno
                </h3>
                <p className="text-xs text-slate-400">
                  Tem certeza que deseja excluir o cadastro do aluno <strong className="text-slate-200">{studentToDelete.name}</strong>?
                </p>
                {studentToDelete.registrationId && (
                  <p className="text-[11px] font-mono text-slate-500">
                    Matrícula: {studentToDelete.registrationId}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
              Esta ação removerá o aluno da lista de frequência e do boletim de notas.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                id="cancel-delete-student-btn"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (studentToDelete) {
                    onDeleteStudent(studentToDelete.id);
                    setStudentToDelete(null);
                  }
                }}
                id="confirm-delete-student-btn"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Sim, Excluir Aluno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
