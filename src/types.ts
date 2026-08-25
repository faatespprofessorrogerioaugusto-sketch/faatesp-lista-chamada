export type AttendanceStatus = 'present' | 'absent' | 'justified';
export type UserRole = 'Professor' | 'Aluno';

export type AppTab = 'dashboard' | 'roll-call' | 'student-query' | 'class-history' | 'students' | 'grades';

export interface UserSession {
  name: string;
  role: UserRole;
  studentId?: string;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  registrationId?: string; // Matricula
  notes?: string;
  createdAt: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface ClassSession {
  id: string;
  classNumber: number; // e.g. 1, 2, 3...
  date: string; // ISO date string YYYY-MM-DD
  startTime?: string; // e.g. "19:00"
  endTime?: string; // e.g. "21:30" or "20:00"
  durationMinutes?: number; // e.g. 150 or 60
  minRequiredMinutes?: number; // e.g. 135 or 54
  topic: string; // Tema da aula
  description?: string;
  instructor?: string;
  records: Record<string, AttendanceStatus>; // studentId -> status
  recordNotes?: Record<string, string>; // studentId -> note
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentStats {
  student: Student;
  totalClasses: number;
  presences: number;
  absences: number;
  justified: number;
  presencePercentage: number;
  statusRequirement: 'approved' | 'warning' | 'critical'; // >=75% = approved, 60-74% = warning, <60% = critical
}

export interface CourseOverviewStats {
  totalStudents: number;
  totalClasses: number;
  totalPresences: number;
  totalAbsences: number;
  totalJustified: number;
  overallPresencePercentage: number;
  studentsWarningCount: number;
}

export interface StudentGrade {
  studentId: string;
  activityN1?: number | null; // Atividade N1 (Peso 6)
  examN1?: number | null;     // Avaliação N1 (Peso 4)
  activityN2?: number | null; // Atividade N2 (Peso 4)
  examN2?: number | null;     // Avaliação N2 (Peso 6)
  updatedAt?: string;
}

export type GradeStatus = 'Dependência' | 'Recuperação' | 'Aprovado' | 'Pendente';

export interface CalculatedStudentGrade {
  studentId: string;
  studentName: string;
  registrationId?: string;
  activityN1: number | null;
  examN1: number | null;
  mediaN1: number | null;
  activityN2: number | null;
  examN2: number | null;
  mediaN2: number | null;
  mediaBase: number | null;
  presencePercentage: number;
  hasBonus: boolean;
  bonusAmount: number;
  mediaFinal: number | null;
  status: GradeStatus;
  isComplete: boolean;
}

