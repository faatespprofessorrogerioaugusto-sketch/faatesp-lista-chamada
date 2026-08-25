import { Student, ClassSession } from '../types';

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_CLASSES: ClassSession[] = [
  {
    id: 'class-1',
    classNumber: 1,
    date: '2026-08-10',
    startTime: '19:00',
    endTime: '21:30',
    durationMinutes: 150,
    minRequiredMinutes: 135,
    topic: 'Apresentação Inicial de Consultoria Organizacional (Encontro Inaugural)',
    description: 'Registro efetuado manualmente pelo Aluno.',
    instructor: 'Professor Rogério Augusto Fernandes',
    isClosed: false,
    createdAt: '2026-08-10T19:00:00.000Z',
    updatedAt: '2026-08-10T21:30:00.000Z',
    records: {},
    recordNotes: {}
  }
];


