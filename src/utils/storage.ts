import { Student, ClassSession, StudentStats, CourseOverviewStats, StudentGrade, CalculatedStudentGrade } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASSES } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'consultoria_students_v7_clean',
  CLASSES: 'consultoria_classes_v7_clean',
  GRADES: 'consultoria_grades_v1',
};

export const loadStudents = (): Student[] => {
  try {
    // Clear legacy keys with mock student data
    localStorage.removeItem('consultoria_students_v1');
    localStorage.removeItem('consultoria_students_v2');
    localStorage.removeItem('consultoria_students_v3');
    localStorage.removeItem('consultoria_students_v4');
    localStorage.removeItem('consultoria_students_v5_clean');
    localStorage.removeItem('consultoria_students_v6_unique');

    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading students from localStorage:', e);
  }
  return [];
};

export const saveStudents = (students: Student[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students:', e);
  }
};

export const loadGrades = (): Record<string, StudentGrade> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRADES);
    if (data) {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading grades from localStorage:', e);
  }
  return {};
};

export const saveGrades = (grades: Record<string, StudentGrade>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  } catch (e) {
    console.error('Error saving grades:', e);
  }
};

export const calculateStudentGrade = (
  student: Student,
  grade: StudentGrade | undefined,
  classes: ClassSession[]
): CalculatedStudentGrade => {
  const stats = getStudentStats(student, classes);
  const presencePercentage = stats.presencePercentage;

  const activityN1 = grade?.activityN1 !== undefined && grade.activityN1 !== null ? Number(grade.activityN1) : null;
  const examN1 = grade?.examN1 !== undefined && grade.examN1 !== null ? Number(grade.examN1) : null;
  const activityN2 = grade?.activityN2 !== undefined && grade.activityN2 !== null ? Number(grade.activityN2) : null;
  const examN2 = grade?.examN2 !== undefined && grade.examN2 !== null ? Number(grade.examN2) : null;

  // Media N1 = (Ativ N1 * 0.6) + (Aval N1 * 0.4)
  const mediaN1 = (activityN1 !== null && examN1 !== null)
    ? Number(((activityN1 * 0.6) + (examN1 * 0.4)).toFixed(2))
    : null;

  // Media N2 = (Ativ N2 * 0.4) + (Aval N2 * 0.6)
  const mediaN2 = (activityN2 !== null && examN2 !== null)
    ? Number(((activityN2 * 0.4) + (examN2 * 0.6)).toFixed(2))
    : null;

  // Media Base = (Media N1 + Media N2) / 2
  const mediaBase = (mediaN1 !== null && mediaN2 !== null)
    ? Number(((mediaN1 + mediaN2) / 2).toFixed(2))
    : null;

  // Bonus condition: If presence >= 75% AND mediaBase between 6.5 and 6.9 (inclusive: 6.5 to 6.9)
  const hasBonus = mediaBase !== null && mediaBase >= 6.5 && mediaBase <= 6.9 && presencePercentage >= 75;
  const bonusAmount = hasBonus ? 0.5 : 0;

  // Media Final
  const mediaFinal = mediaBase !== null
    ? Math.min(10, Number((mediaBase + bonusAmount).toFixed(2)))
    : null;

  // Status & Colors
  // <= 3.0 -> Dependência (Red)
  // <= 6.9 -> Recuperação (Green)
  // > 6.9 -> Aprovado (Blue)
  let status: 'Dependência' | 'Recuperação' | 'Aprovado' | 'Pendente' = 'Pendente';
  if (mediaFinal !== null) {
    if (mediaFinal <= 3.0) {
      status = 'Dependência';
    } else if (mediaFinal <= 6.9) {
      status = 'Recuperação';
    } else {
      status = 'Aprovado';
    }
  }

  const isComplete = activityN1 !== null && examN1 !== null && activityN2 !== null && examN2 !== null;

  return {
    studentId: student.id,
    studentName: student.name,
    registrationId: student.registrationId,
    activityN1,
    examN1,
    mediaN1,
    activityN2,
    examN2,
    mediaN2,
    mediaBase,
    presencePercentage,
    hasBonus,
    bonusAmount,
    mediaFinal,
    status,
    isComplete,
  };
};


export const loadClasses = (): ClassSession[] => {
  try {
    // Clear old corrupted duplicate keys
    localStorage.removeItem('consultoria_classes_v1');
    localStorage.removeItem('consultoria_classes_v2');
    localStorage.removeItem('consultoria_classes_v3');
    localStorage.removeItem('consultoria_classes_v4');
    localStorage.removeItem('consultoria_classes_v5_clean');
    localStorage.removeItem('consultoria_classes_v6_unique');

    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (data) {
      const parsed: ClassSession[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Enforce strict uniqueness by classNumber (keep only 1 per classNumber)
        const map = new Map<number, ClassSession>();
        parsed.forEach((c) => {
          map.set(Number(c.classNumber), c);
        });
        const deduplicated = Array.from(map.values()).map((c) => {
          let updated = { ...c };
          if (updated.description && updated.description.includes('via Google Meet com regra de 90% de permanência')) {
            updated.description = 'Registro efetuado manualmente pelo Aluno.';
          }
          if (updated.instructor && updated.instructor.includes('Marinês Borba')) {
            updated.instructor = 'Professor Rogério Augusto Fernandes';
          }
          return updated;
        }).sort((a, b) => a.classNumber - b.classNumber);
        return deduplicated;
      }
    }
  } catch (e) {
    console.error('Error loading classes from localStorage:', e);
  }

  saveClasses(INITIAL_CLASSES);
  return INITIAL_CLASSES;
};

export const saveClasses = (classes: ClassSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch (e) {
    console.error('Error saving classes:', e);
  }
};

export const resetToDefaultData = (): { students: Student[]; classes: ClassSession[] } => {
  saveStudents([]);
  saveClasses(INITIAL_CLASSES);
  try {
    localStorage.removeItem('consultoria_students_v1');
    localStorage.removeItem('consultoria_classes_v1');
  } catch (e) {}
  return { students: [], classes: INITIAL_CLASSES };
};

// Calculate individual student stats
export const getStudentStats = (student: Student, classes: ClassSession[]): StudentStats => {
  const totalClasses = classes.length;
  let presences = 0;
  let absences = 0;
  let justified = 0;

  classes.forEach((c) => {
    const status = c.records[student.id];
    if (status === 'present') presences++;
    else if (status === 'absent') absences++;
    else if (status === 'justified') {
      justified++;
      // Justified counts towards presence or separate category?
      // In academic practice, justified absences are non-punitive or counted as attendance.
      // Let's count present + justified as present for percentage or count presences directly.
      // We will count presences / totalClasses for percentage, but mark justified as non-absence.
    }
  });

  // Effective presence percentage: (presences + justified) / totalClasses if totalClasses > 0
  const effectivePresences = presences + justified;
  const presencePercentage = totalClasses > 0 ? Math.round((effectivePresences / totalClasses) * 100) : 100;

  let statusRequirement: 'approved' | 'warning' | 'critical' = 'approved';
  if (presencePercentage < 60) {
    statusRequirement = 'critical';
  } else if (presencePercentage < 75) {
    statusRequirement = 'warning';
  }

  return {
    student,
    totalClasses,
    presences,
    absences,
    justified,
    presencePercentage,
    statusRequirement,
  };
};

// Calculate course overview stats
export const getCourseOverviewStats = (students: Student[], classes: ClassSession[]): CourseOverviewStats => {
  const totalStudents = students.length;
  const totalClasses = classes.length;

  let totalPresences = 0;
  let totalAbsences = 0;
  let totalJustified = 0;
  let studentsWarningCount = 0;

  students.forEach((student) => {
    const stats = getStudentStats(student, classes);
    totalPresences += stats.presences;
    totalAbsences += stats.absences;
    totalJustified += stats.justified;
    if (stats.presencePercentage < 75) {
      studentsWarningCount++;
    }
  });

  const totalPossibleRecords = totalStudents * totalClasses;
  const totalAttended = totalPresences + totalJustified;
  const overallPresencePercentage = totalPossibleRecords > 0 ? Math.round((totalAttended / totalPossibleRecords) * 100) : 100;

  return {
    totalStudents,
    totalClasses,
    totalPresences,
    totalAbsences,
    totalJustified,
    overallPresencePercentage,
    studentsWarningCount,
  };
};
