import * as XLSX from 'xlsx';
import { Student, ClassSession, StudentGrade, AttendanceStatus } from '../types';
import { getStudentStats, calculateStudentGrade } from './storage';

export interface ImportResult {
  students: Student[];
  classes: ClassSession[];
  grades: Record<string, StudentGrade>;
  importedClassesCount: number;
  importedGradesCount: number;
}

/**
 * Export complete attendance records AND grades into a multi-sheet Excel (.xlsx) file
 */
export const exportToExcel = (
  students: Student[],
  classes: ClassSession[],
  courseName = 'Consultoria Organizacional',
  grades?: Record<string, StudentGrade>
) => {
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

  // 2. SHEET 2: BOLETIM DE NOTAS (Se houver grades)
  if (grades) {
    const gradesRows = students.map((student) => {
      const g = grades[student.id];
      const calc = calculateStudentGrade(student, g, sortedClasses);
      return {
        'Matrícula': student.registrationId || '-',
        'Nome do Aluno': student.name,
        'Ativ. N1 (Peso 6)': calc.activityN1 !== null ? calc.activityN1 : '-',
        'Aval. N1 (Peso 4)': calc.examN1 !== null ? calc.examN1 : '-',
        'Média N1': calc.mediaN1 !== null ? calc.mediaN1 : '-',
        'Ativ. N2 (Peso 4)': calc.activityN2 !== null ? calc.activityN2 : '-',
        'Aval. N2 (Peso 6)': calc.examN2 !== null ? calc.examN2 : '-',
        'Média N2': calc.mediaN2 !== null ? calc.mediaN2 : '-',
        'Frequência (%)': `${calc.presencePercentage}%`,
        'Bônus (+0.5)': calc.hasBonus ? '+0.5' : 'Não',
        'Média Final': calc.mediaFinal !== null ? calc.mediaFinal : '-',
        'Status': calc.status,
      };
    });
    const wsGrades = XLSX.utils.json_to_sheet(gradesRows);
    wsGrades['!cols'] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsGrades, 'Boletim de Notas');
  }

  // 3. SHEET 3: RESUMO DE ALUNOS
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

  // 4. SHEET 4: HISTÓRICO DE AULAS
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
 * Read uploaded Excel file and return imported data: students, classes (with all attendance records), and grades
 */
export const importFromExcel = (
  file: File,
  existingStudents: Student[] = [],
  existingClasses: ClassSession[] = [],
  existingGrades: Record<string, StudentGrade> = {}
): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Identify sheets
        // Common sheet names: 'Matriz de Chamada', 'Boletim de Notas', 'Boletim_Notas', 'Histórico de Aulas', or first sheet
        const sheetNames = workbook.SheetNames;
        const matrixSheetName = sheetNames.find(
          (s) => s.toLowerCase().includes('matriz') || s.toLowerCase().includes('chamada')
        ) || sheetNames[0];

        const gradesSheetName = sheetNames.find(
          (s) => s.toLowerCase().includes('boletim') || s.toLowerCase().includes('nota')
        );

        const historySheetName = sheetNames.find(
          (s) => s.toLowerCase().includes('histórico') || s.toLowerCase().includes('historico') || s.toLowerCase().includes('aula')
        );

        // 1. Process Matrix Sheet (Students and Attendance per Class)
        const wsMatrix = workbook.Sheets[matrixSheetName];
        const matrixRows: any[] = wsMatrix ? XLSX.utils.sheet_to_json(wsMatrix) : [];

        // Build or match students
        const importedStudents: Student[] = [];
        const studentByRegOrName = new Map<string, Student>();

        // Pre-populate with existing students to keep IDs stable if they match
        existingStudents.forEach((s) => {
          if (s.registrationId) studentByRegOrName.set(s.registrationId.trim().toLowerCase(), s);
          if (s.name) studentByRegOrName.set(s.name.trim().toLowerCase(), s);
        });

        // Detect all Class Columns from matrix headers (e.g. "Aula 1 (08/09)", "Aula 02", "Aula 2")
        const classColumnRegex = /^Aula\s*(\d+)(?:\s*\((.*?)\))?/i;
        const classColumns: { key: string; classNumber: number; dateFromHeader?: string }[] = [];

        if (matrixRows.length > 0) {
          const sampleKeys = Object.keys(matrixRows[0]);
          sampleKeys.forEach((key) => {
            const match = key.match(classColumnRegex);
            if (match) {
              const classNum = parseInt(match[1], 10);
              let datePart = match[2]?.trim();
              classColumns.push({
                key,
                classNumber: classNum,
                dateFromHeader: datePart,
              });
            }
          });
        }

        // Sort detected class columns by class number
        classColumns.sort((a, b) => a.classNumber - b.classNumber);

        // Map to hold class sessions: classNumber -> ClassSession
        const classSessionsMap = new Map<number, ClassSession>();
        existingClasses.forEach((c) => {
          classSessionsMap.set(c.classNumber, { ...c, records: { ...c.records } });
        });

        // Optional: Read "Histórico de Aulas" sheet for topic/instructor/date
        if (historySheetName && workbook.Sheets[historySheetName]) {
          const historyRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[historySheetName]);
          historyRows.forEach((row) => {
            const numVal = row['Aula Nº'] || row['Aula'] || row['Numero'] || row['Número'];
            const classNum = parseInt(String(numVal), 10);
            if (!isNaN(classNum)) {
              let dateStr = row['Data'] || '';
              // If date is like "08/09", convert to YYYY-MM-DD
              dateStr = parseShortDateToIso(String(dateStr));

              const topic = String(row['Tema / Módulo da Aula'] || row['Tema'] || `Aula ${classNum}`).trim();
              const instructor = String(row['Professor'] || 'Professor Rogério Augusto Fernandes').trim();

              const existing = classSessionsMap.get(classNum);
              if (existing) {
                existing.topic = topic;
                if (dateStr) existing.date = dateStr;
                existing.instructor = instructor;
              } else {
                classSessionsMap.set(classNum, {
                  id: `class-${classNum}-${Date.now()}`,
                  classNumber: classNum,
                  date: dateStr || new Date().toISOString().slice(0, 10),
                  topic: topic,
                  instructor: instructor,
                  records: {},
                  recordNotes: {},
                  isClosed: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          });
        }

        // Ensure detected class columns exist in classSessionsMap
        classColumns.forEach((col) => {
          if (!classSessionsMap.has(col.classNumber)) {
            let dateIso = col.dateFromHeader ? parseShortDateToIso(col.dateFromHeader) : new Date().toISOString().slice(0, 10);
            classSessionsMap.set(col.classNumber, {
              id: `class-${col.classNumber}-${Date.now()}`,
              classNumber: col.classNumber,
              date: dateIso,
              topic: `Aula ${col.classNumber}: Consultoria Organizacional`,
              instructor: 'Professor Rogério Augusto Fernandes',
              records: {},
              recordNotes: {},
              isClosed: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        });

        // Parse each student row from Matrix
        matrixRows.forEach((row, index) => {
          const name = row['Nome do Aluno'] || row['Nome Completo'] || row['Nome'] || row['Aluno'] || row['nome'];
          if (!name || typeof name !== 'string') return;

          const trimmedName = name.trim();
          const rawRegId = row['Matrícula'] || row['Matricula'] || row['Código'] || row['ID'] || `2026${String(index + 1).padStart(3, '0')}`;
          const regId = String(rawRegId).trim();
          const email = String(row['Email'] || row['E-mail'] || row['email'] || '').trim();

          // Check if student already known
          let student = studentByRegOrName.get(regId.toLowerCase()) || studentByRegOrName.get(trimmedName.toLowerCase());
          if (!student) {
            student = {
              id: `st-imp-${Date.now()}-${index}`,
              name: trimmedName,
              registrationId: regId,
              email: email,
              createdAt: new Date().toISOString().slice(0, 10),
            };
            studentByRegOrName.set(regId.toLowerCase(), student);
            studentByRegOrName.set(trimmedName.toLowerCase(), student);
          } else {
            // Update fields if missing
            if (!student.registrationId && regId) student.registrationId = regId;
            if (!student.email && email) student.email = email;
          }

          if (!importedStudents.some((s) => s.id === student!.id)) {
            importedStudents.push(student);
          }

          // Populate attendance for each detected class column
          classColumns.forEach((col) => {
            const rawVal = row[col.key];
            if (rawVal !== undefined && rawVal !== null) {
              const strVal = String(rawVal).trim().toUpperCase();
              let status: AttendanceStatus | null = null;
              if (strVal === 'P' || strVal === 'PRESENTE' || strVal === '1') {
                status = 'present';
              } else if (strVal === 'A' || strVal === 'F' || strVal === 'AUSENTE' || strVal === 'FALTA' || strVal === '0') {
                status = 'absent';
              } else if (strVal === 'J' || strVal === 'JUSTIFICADA' || strVal === 'JUSTIFICADO') {
                status = 'justified';
              }

              if (status) {
                const session = classSessionsMap.get(col.classNumber);
                if (session) {
                  session.records[student!.id] = status;
                }
              }
            }
          });
        });

        // 2. Parse Grades (from 'Boletim de Notas' sheet, or from Matrix if present)
        const importedGrades: Record<string, StudentGrade> = { ...existingGrades };
        let gradesCount = 0;

        const parseGradeNumber = (val: any): number | null => {
          if (val === undefined || val === null || val === '' || val === '-' || val === '—') return null;
          const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
          return isNaN(num) ? null : Math.max(0, Math.min(10, num));
        };

        if (gradesSheetName && workbook.Sheets[gradesSheetName]) {
          const gradesRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[gradesSheetName]);
          gradesRows.forEach((row) => {
            const name = row['Nome do Aluno'] || row['Aluno'] || row['Nome'];
            const regId = row['Matrícula'] || row['Matricula'];

            let student: Student | undefined;
            if (regId) student = studentByRegOrName.get(String(regId).trim().toLowerCase());
            if (!student && name) student = studentByRegOrName.get(String(name).trim().toLowerCase());

            if (student) {
              const actN1 = parseGradeNumber(row['Ativ. N1 (Peso 6)'] ?? row['Atividade N1'] ?? row['Ativ N1']);
              const examN1 = parseGradeNumber(row['Aval. N1 (Peso 4)'] ?? row['Avaliação N1'] ?? row['Aval N1']);
              const actN2 = parseGradeNumber(row['Ativ. N2 (Peso 4)'] ?? row['Atividade N2'] ?? row['Ativ N2']);
              const examN2 = parseGradeNumber(row['Aval. N2 (Peso 6)'] ?? row['Avaliação N2'] ?? row['Aval N2']);

              if (actN1 !== null || examN1 !== null || actN2 !== null || examN2 !== null) {
                importedGrades[student.id] = {
                  studentId: student.id,
                  activityN1: actN1,
                  examN1: examN1,
                  activityN2: actN2,
                  examN2: examN2,
                  updatedAt: new Date().toISOString(),
                };
                gradesCount++;
              }
            }
          });
        }

        const finalListClasses = Array.from(classSessionsMap.values()).sort((a, b) => a.classNumber - b.classNumber);

        resolve({
          students: importedStudents,
          classes: finalListClasses,
          grades: importedGrades,
          importedClassesCount: classColumns.length,
          importedGradesCount: gradesCount,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Helper to turn "08/09" or "08/09/2026" into "YYYY-MM-DD"
 */
function parseShortDateToIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const clean = dateStr.trim();
  const parts = clean.split(/[/.-]/);
  const currentYear = new Date().getFullYear();

  if (parts.length === 2) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  } else if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    // If format is YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
}

// Backward compatibility helper
export const importStudentsFromExcel = async (file: File): Promise<Student[]> => {
  const result = await importFromExcel(file);
  return result.students;
};

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}
