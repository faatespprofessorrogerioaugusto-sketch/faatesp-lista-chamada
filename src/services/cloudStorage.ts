import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Student, ClassSession, StudentGrade } from '../types';
import { INITIAL_CLASSES } from '../data/initialData';

// Firestore collection names
const COLLECTIONS = {
  STUDENTS: 'students',
  CLASSES: 'classes',
  GRADES: 'grades',
};

/**
 * Fetch all students from Firestore
 */
export async function getStudentsFromCloud(): Promise<Student[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const list: Student[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Student);
    });
    return list;
  } catch (err) {
    console.error('Error fetching students from Firestore:', err);
    return [];
  }
}

/**
 * Save single student to Firestore
 */
export async function saveStudentToCloud(student: Student): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
  } catch (err) {
    console.error('Error saving student to Firestore:', err);
  }
}

/**
 * Delete student from Firestore
 */
export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
  } catch (err) {
    console.error('Error deleting student from Firestore:', err);
  }
}

/**
 * Batch save/update multiple students to Firestore
 */
export async function saveStudentsBatchToCloud(students: Student[]): Promise<void> {
  if (students.length === 0) return;
  try {
    const batch = writeBatch(db);
    students.forEach((s) => {
      const ref = doc(db, COLLECTIONS.STUDENTS, s.id);
      batch.set(ref, s);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving students batch to Firestore:', err);
  }
}

/**
 * Fetch all classes from Firestore
 */
export async function getClassesFromCloud(): Promise<ClassSession[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.CLASSES));
    const list: ClassSession[] = [];
    snap.forEach((d) => {
      list.push(d.data() as ClassSession);
    });
    return list.sort((a, b) => a.classNumber - b.classNumber);
  } catch (err) {
    console.error('Error fetching classes from Firestore:', err);
    return [];
  }
}

/**
 * Save or update class in Firestore
 */
export async function saveClassToCloud(session: ClassSession): Promise<void> {
  try {
    const docId = session.id || `class-${session.classNumber}`;
    await setDoc(doc(db, COLLECTIONS.CLASSES, docId), { ...session, id: docId });
  } catch (err) {
    console.error('Error saving class session to Firestore:', err);
  }
}

/**
 * Batch save multiple classes to Firestore
 */
export async function saveClassesBatchToCloud(classes: ClassSession[]): Promise<void> {
  if (classes.length === 0) return;
  try {
    const batch = writeBatch(db);
    classes.forEach((c) => {
      const docId = c.id || `class-${c.classNumber}`;
      const ref = doc(db, COLLECTIONS.CLASSES, docId);
      batch.set(ref, { ...c, id: docId });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving classes batch to Firestore:', err);
  }
}

/**
 * Delete class from Firestore
 */
export async function deleteClassFromCloud(classId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLASSES, classId));
  } catch (err) {
    console.error('Error deleting class from Firestore:', err);
  }
}

/**
 * Fetch all grades from Firestore
 */
export async function getGradesFromCloud(): Promise<Record<string, StudentGrade>> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.GRADES));
    const map: Record<string, StudentGrade> = {};
    snap.forEach((d) => {
      const data = d.data() as StudentGrade;
      if (data.studentId) {
        map[data.studentId] = data;
      }
    });
    return map;
  } catch (err) {
    console.error('Error fetching grades from Firestore:', err);
    return {};
  }
}

/**
 * Save single grade to Firestore
 */
export async function saveGradeToCloud(grade: StudentGrade): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GRADES, grade.studentId), grade);
  } catch (err) {
    console.error('Error saving grade to Firestore:', err);
  }
}

/**
 * Batch save multiple grades to Firestore
 */
export async function saveGradesBatchToCloud(grades: Record<string, StudentGrade>): Promise<void> {
  const entries = Object.values(grades);
  if (entries.length === 0) return;
  try {
    const batch = writeBatch(db);
    entries.forEach((g) => {
      const ref = doc(db, COLLECTIONS.GRADES, g.studentId);
      batch.set(ref, g);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error saving grades batch to Firestore:', err);
  }
}

/**
 * Real-time listener for students collection
 */
export function subscribeToStudents(callback: (students: Student[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.STUDENTS), (snapshot) => {
    const list: Student[] = [];
    snapshot.forEach((d) => list.push(d.data() as Student));
    callback(list);
  }, (err) => {
    console.error('Firestore students subscription error:', err);
  });
}

/**
 * Real-time listener for classes collection
 */
export function subscribeToClasses(callback: (classes: ClassSession[]) => void) {
  return onSnapshot(collection(db, COLLECTIONS.CLASSES), (snapshot) => {
    const list: ClassSession[] = [];
    snapshot.forEach((d) => list.push(d.data() as ClassSession));
    list.sort((a, b) => a.classNumber - b.classNumber);
    callback(list);
  }, (err) => {
    console.error('Firestore classes subscription error:', err);
  });
}

/**
 * Real-time listener for grades collection
 */
export function subscribeToGrades(callback: (grades: Record<string, StudentGrade>) => void) {
  return onSnapshot(collection(db, COLLECTIONS.GRADES), (snapshot) => {
    const map: Record<string, StudentGrade> = {};
    snapshot.forEach((d) => {
      const data = d.data() as StudentGrade;
      if (data.studentId) map[data.studentId] = data;
    });
    callback(map);
  }, (err) => {
    console.error('Firestore grades subscription error:', err);
  });
}

/**
 * Clear all collections in Firestore (for reset)
 */
export async function clearAllCloudData(): Promise<void> {
  try {
    const studentsSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    const classesSnap = await getDocs(collection(db, COLLECTIONS.CLASSES));
    const gradesSnap = await getDocs(collection(db, COLLECTIONS.GRADES));

    const batch = writeBatch(db);
    studentsSnap.forEach((d) => batch.delete(d.ref));
    classesSnap.forEach((d) => batch.delete(d.ref));
    gradesSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    // Re-seed initial classes
    await saveClassesBatchToCloud(INITIAL_CLASSES);
  } catch (err) {
    console.error('Error clearing cloud data:', err);
  }
}
