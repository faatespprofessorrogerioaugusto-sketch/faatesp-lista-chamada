import * as XLSX from 'xlsx';
import { Student, ClassSession } from '../types';
import { getStudentStats } from './storage';

/**
 * Export complete attendance records into a multi-sheet Excel (.xlsx) file
 */
export const exportToExcel = (students: Student[], classes: ClassSession[], courseName = 'Consultoria Organizacional') => {
  const wb = XLSX.utils.book_new();

  // Sort classes by classNumber
  const sortedClasses = [...classes].sort((a, b) => a.classNumber - b.classNumber);

  // 1. SHEET 1: MATRIZ DE CHAMADA
  const matrixHeaders = [
    'Matrícula',
    'Nome do Aluno',
    'Email',
    ...sortedClasses.map((c) => `Aula ${c.classNumber} (${formatDateShort(c.date)})`),
    'Total Presenças',
    'Total Ausências',
    'Total Justificadas',
    '% Frequência',
    'Situação',
  ];

  const matrixRows = students.map((student) => {
    const stats = getStudentStats(student, sortedClasses);
    const rowRecord: Record<string, string | number> = {
      'Matrícula': student.registrationId || '-',
      'Nome do Aluno': student.name,
      'Email': student.email || '-',
    };

    sortedClasses.forEach((c) => {
      const status = c.records[student.id];
      let val = '-';
      if (status === 'present') val = 'P';
      else if (status === 'absent') val = 'A';
      else if (status === 'justified') val = 'J';
      rowRecord[`Aula ${c.classNumber} (${formatDateShort(c.date)})`] = val;
    });

    rowRecord['Total Presenças'] = stats.presences;
    rowRecord['Total Ausências'] = stats.absences;
    rowRecord['Total Justificadas'] = stats.justified;
    rowRecord['% Frequência'] = `${stats.presencePercentage}%`;
    rowRecord['Situação'] = stats.presencePercentage >= 75 ? 'Aprovado por Frequência' : 'Alerta de Infrequência';

    return rowRecord;
  });

  const wsMatrix = XLSX.utils.json_to_sheet(matrixRows, { header: matrixHeaders });

  // Auto-width columns for Matrix
  const matrixCols = [
    { wch: 12 }, // Matrícula
    { wch: 28 }, // Nome
    { wch: 28 }, // Email
    ...sortedClasses.map(() => ({ wch: 14 })), // Aulas
    { wch: 15 }, // Presenças
    { wch: 15 }, // Ausências
    { wch: 18 }, // Justificadas
    { wch: 14 }, // %
    { wch: 24 }, // Situação
  ];
  wsMatrix['!cols'] = matrixCols;

  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriz de Chamada');

  // 2. SHEET 2: RESUMO DE ALUNOS
  const studentSummaryRows = students.map((s) => {
    const stats = getStudentStats(s, sortedClasses);
    return {
      'Matrícula': s.registrationId || '-',
      'Nome Completo': s.name,
      'Email': s.email || '-',
      'Aulas Ministradas': stats.totalClasses,
      'Presenças (P)': stats.presences,
      'Ausências (A)': stats.absences,
      'Justificadas (J)': stats.justified,
      '% Frequência': `${stats.presencePercentage}%`,
      'Situação': stats.presencePercentage >= 75 ? 'Regular (≥75%)' : 'Risco de Reprovação (<75%)',
    };
  });
  const wsStudents = XLSX.utils.json_to_sheet(studentSummaryRows);
  wsStudents['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Resumo de Alunos');

  // 3. SHEET 3: HISTÓRICO DE AULAS
  const classHistoryRows = sortedClasses.map((c) => {
    let pCount = 0;
    let aCount = 0;
    let jCount = 0;
    Object.values(c.records).forEach((st) => {
      if (st === 'present') pCount++;
      else if (st === 'absent') aCount++;
      else if (st === 'justified') jCount++;
    });
    const totalStudents = students.length;
    const rate = totalStudents > 0 ? Math.round(((pCount + jCount) / totalStudents) * 100) : 0;

    return {
      'Aula Nº': c.classNumber,
      'Data': formatDateShort(c.date),
      'Tema / Módulo da Aula': c.topic,
      'Professor': c.instructor || '-',
      'Presentes': pCount,
      'Ausentes': aCount,
      'Justificados': jCount,
      '% Presença na Aula': `${rate}%`,
    };
  });
  const wsClasses = XLSX.utils.json_to_sheet(classHistoryRows);
  wsClasses['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 45 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsClasses, 'Histórico de Aulas');

  // Generate filename with date
  const today = new Date().toISOString().slice(0, 10);
  const fileName = `Chamada_${courseName.replace(/\s+/g, '_')}_${today}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Generate and download a sample Excel template for importing students
 */
export const downloadExcelTemplate = () => {
  const wb = XLSX.utils.book_new();

  const sampleData = [
    {
      'Matrícula': '2026011',
      'Nome do Aluno': 'Beatriz Mendes Siqueira',
      'Email': 'beatriz.siqueira@exemplo.com.br',
    },
    {
      'Matrícula': '2026012',
      'Nome do Aluno': 'Leonardo Fonseca Silva',
      'Email': 'leonardo.silva@exemplo.com.br',
    },
    {
      'Matrícula': '2026013',
      'Nome do Aluno': 'Vanessa Castro Prado',
      'Email': 'vanessa.prado@exemplo.com.br',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Alunos_Modelo');
  XLSX.writeFile(wb, 'Modelo_Importacao_Alunos_Consultoria.xlsx');
};

/**
 * Read uploaded Excel file and return imported student objects
 */
export const importStudentsFromExcel = (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newStudents: Student[] = [];

        jsonRows.forEach((row, index) => {
          // Normalize key names (support 'Nome', 'Nome do Aluno', 'Aluno', 'Matricula', 'Email')
          const name = row['Nome do Aluno'] || row['Nome'] || row['Aluno'] || row['nome'];
          if (!name || typeof name !== 'string') return;

          const regId = row['Matrícula'] || row['Matricula'] || row['Código'] || row['ID'] || `2026${String(index + 1).padStart(3, '0')}`;
          const email = row['Email'] || row['E-mail'] || row['email'] || '';

          newStudents.push({
            id: `st-imp-${Date.now()}-${index}`,
            name: name.trim(),
            registrationId: String(regId).trim(),
            email: String(email).trim(),
            createdAt: new Date().toISOString().slice(0, 10),
          });
        });

        resolve(newStudents);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}
