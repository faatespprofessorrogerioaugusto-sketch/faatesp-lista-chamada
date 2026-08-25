import React, { useState, useEffect } from 'react';
import { Student, ClassSession, UserSession, AttendanceStatus, StudentGrade, AppTab } from './types';
import {
  loadStudents,
  saveStudents,
  loadClasses,
  saveClasses,
  loadGrades,
  saveGrades,
  resetToDefaultData,
} from './utils/storage';
import { exportToExcel } from './utils/excelUtils';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { ClassRollCall } from './components/ClassRollCall';
import { StudentRollCall } from './components/StudentRollCall';
import { StudentQuery } from './components/StudentQuery';
import { ClassHistoryManager } from './components/ClassHistoryManager';
import { StudentManager } from './components/StudentManager';
import { GradesBulletin } from './components/GradesBulletin';
import { ExcelModal } from './components/ExcelModal';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [grades, setGrades] = useState<Record<string, StudentGrade>>({});
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Navigation helpers
  const [selectedStudentForQuery, setSelectedStudentForQuery] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Excel Modal
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const loadedSt = loadStudents();
    const loadedCl = loadClasses();
    const loadedGr = loadGrades();
    setStudents(loadedSt);
    setClasses(loadedCl);
    setGrades(loadedGr);
  }, []);

  // Save changes
  const updateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    saveStudents(newStudents);
  };

  const updateClasses = (newClasses: ClassSession[]) => {
    setClasses(newClasses);
    saveClasses(newClasses);
  };

  const updateGrades = (newGrades: Record<string, StudentGrade>) => {
    setGrades(newGrades);
    saveGrades(newGrades);
  };

  // Login & Logout
  const handleLogin = (session: UserSession, updatedStudents?: Student[]) => {
    if (updatedStudents) {
      updateStudents(updatedStudents);
    }
    setCurrentUser(session);
    try {
      localStorage.setItem('consultoria_user_v1', JSON.stringify(session));
    } catch (e) {
      console.error('Error saving user session:', e);
    }

    if (session.role === 'Aluno') {
      setActiveTab('roll-call');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('consultoria_user_v1');
    } catch (e) {
      console.error('Error removing user session:', e);
    }
  };

  // Handlers for Class Roll Call
  const handleSaveClassSession = (session: ClassSession) => {
    const sessionNum = Number(session.classNumber);
    const existingIndex = classes.findIndex((c) => Number(c.classNumber) === sessionNum || c.id === session.id);
    let updated: ClassSession[];

    if (existingIndex >= 0) {
      updated = classes.map((c, i) => (i === existingIndex ? { ...c, ...session, classNumber: sessionNum } : c));
    } else {
      updated = [...classes, { ...session, classNumber: sessionNum }];
    }

    // Deduplicate by classNumber and sort
    const uniqueMap = new Map<number, ClassSession>();
    updated.forEach((c) => uniqueMap.set(Number(c.classNumber), c));
    const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.classNumber - b.classNumber);

    updateClasses(sorted);
    setEditingClassId(session.id);
  };

  // Handlers for Student Management
  const handleAddStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    updateStudents([...students, newStudent]);
  };

  const handleEditStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    updateStudents(updated);
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter((s) => s.id !== studentId);
    updateStudents(updated);
  };

  const handleImportStudents = (imported: Student[]) => {
    // Append unique students
    const existingIds = new Set(students.map((s) => s.registrationId));
    const newUnique = imported.filter((imp) => !imp.registrationId || !existingIds.has(imp.registrationId));
    const merged = [...students, ...newUnique];
    updateStudents(merged);
  };

  // Class History Actions
  const handleEditClass = (classId: string) => {
    setEditingClassId(classId);
    setActiveTab('roll-call');
  };

  const handleDeleteClass = (classId: string) => {
    const updated = classes.filter((c) => c.id !== classId);
    updateClasses(updated);
  };

  // Quick record update from student query or student screen
  const handleUpdateRecordStatus = (
    classId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return {
          ...c,
          records: {
            ...c.records,
            [studentId]: status,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    updateClasses(updated);
  };

  // Jump to student query from Dashboard
  const handleSelectStudentForQuery = (studentId: string) => {
    setSelectedStudentForQuery(studentId);
    setActiveTab('student-query');
  };

  // Export directly
  const handleExportExcel = () => {
    exportToExcel(students, classes, 'Consultoria Organizacional');
  };

  // Clear/Reset all data
  const handleResetData = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmResetAllData = () => {
    const { students: s, classes: c } = resetToDefaultData();
    setStudents(s);
    setClasses(c);
    setSelectedStudentForQuery(null);
    setEditingClassId(null);
    setIsResetConfirmOpen(false);
  };

  // When no user is logged in, show the Login Screen directly
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex items-center justify-center p-4">
        <LoginModal
          students={students}
          onLogin={(session, updatedSt) => {
            handleLogin(session, updatedSt);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'roll-call' && activeTab !== 'roll-call') {
            setEditingClassId(null);
          }
          setActiveTab(tab);
        }}
        onExportExcel={handleExportExcel}
        onOpenImportModal={() => setIsExcelModalOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ALUNO VIEWS */}
        {currentUser?.role === 'Aluno' && (
          <>
            {activeTab === 'roll-call' && (
              <StudentRollCall
                studentName={currentUser.name}
                studentId={currentUser.studentId || ''}
                classes={classes}
                onUpdateAttendance={handleUpdateRecordStatus}
              />
            )}

            {activeTab === 'grades' && (
              <GradesBulletin
                students={students}
                classes={classes}
                grades={grades}
                onUpdateGrades={updateGrades}
                currentUserRole="Aluno"
                currentStudentId={currentUser.studentId}
                currentUserName={currentUser.name}
              />
            )}
          </>
        )}

        {/* PROFESSOR VIEWS */}
        {currentUser?.role === 'Professor' && (
          <>
            {activeTab === 'dashboard' && (
              <UnifiedDashboard
                students={students}
                classes={classes}
                onSelectStudentForQuery={handleSelectStudentForQuery}
                onNavigateToRollCall={() => {
                  setEditingClassId(null);
                  setActiveTab('roll-call');
                }}
                onExportExcel={handleExportExcel}
              />
            )}

            {activeTab === 'roll-call' && (
              <ClassRollCall
                students={students}
                existingClasses={classes}
                editingClassId={editingClassId}
                onSaveClass={handleSaveClassSession}
                onCancelEdit={() => {
                  setEditingClassId(null);
                  setActiveTab('class-history');
                }}
              />
            )}

            {activeTab === 'student-query' && (
              <StudentQuery
                students={students}
                classes={classes}
                selectedStudentId={selectedStudentForQuery}
                onSelectStudent={setSelectedStudentForQuery}
                onUpdateRecordStatus={handleUpdateRecordStatus}
              />
            )}

            {activeTab === 'class-history' && (
              <ClassHistoryManager
                classes={classes}
                students={students}
                onEditClass={handleEditClass}
                onDeleteClass={handleDeleteClass}
                onNavigateToNewRollCall={() => {
                  setEditingClassId(null);
                  setActiveTab('roll-call');
                }}
              />
            )}

            {activeTab === 'students' && (
              <StudentManager
                students={students}
                classes={classes}
                activeClassId={editingClassId}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onOpenImportModal={() => setIsExcelModalOpen(true)}
              />
            )}

            {activeTab === 'grades' && (
              <GradesBulletin
                students={students}
                classes={classes}
                grades={grades}
                onUpdateGrades={updateGrades}
                currentUserRole="Professor"
                currentStudentId={currentUser.studentId}
                currentUserName={currentUser.name}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a]/90 border-t border-slate-800/80 py-4 mt-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-slate-200">Consultoria Organizacional</strong> • Sistema de Gestão de Frequência <strong className="text-slate-200">by Rogério Augusto Fernandes (Mister Roger)</strong>
          </p>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sincronizado com Excel (.xlsx)</span>
          </div>
        </div>
      </footer>

      {/* Excel Modal */}
      <ExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        students={students}
        classes={classes}
        onImportStudents={handleImportStudents}
      />

      {/* Reset All Data Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-rose-400">
                Limpar Todos os Dados
              </h3>
              <p className="text-xs text-slate-300">
                Tem certeza de que deseja <strong>limpar e redefinir</strong> todos os dados de alunos, chamadas e notas gravadas?
              </p>
              <p className="text-[11px] text-slate-500">
                Esta ação restaura os dados padrão do curso e não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                id="cancel-reset-data-btn"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAllData}
                id="confirm-reset-data-btn"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Sim, Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

