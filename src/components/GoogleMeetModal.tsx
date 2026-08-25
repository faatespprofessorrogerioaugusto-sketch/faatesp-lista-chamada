import React, { useState } from 'react';
import { Student, ClassSession, AttendanceStatus } from '../types';
import { Video, Upload, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, Sparkles, Clock, ShieldCheck, Download, X } from 'lucide-react';

interface GoogleMeetModalProps {
  students: Student[];
  existingClasses: ClassSession[];
  onImportMeetSession: (session: ClassSession, updatedStudents?: Student[]) => void;
  onClose: () => void;
}

interface MeetParticipantResult {
  studentName: string;
  studentId?: string;
  email?: string;
  durationMinutes: number;
  percentage: number;
  status: AttendanceStatus;
  matched: boolean;
}

export const GoogleMeetModal: React.FC<GoogleMeetModalProps> = ({
  students,
  existingClasses,
  onImportMeetSession,
  onClose,
}) => {
  const [meetingDate, setMeetingDate] = useState<string>(() => {
    // Default to latest Tuesday or today
    const now = new Date();
    const day = now.getDay();
    const diffToTuesday = day >= 2 ? day - 2 : day + 5;
    const tuesday = new Date(now);
    tuesday.setDate(now.getDate() - diffToTuesday);
    return tuesday.toISOString().slice(0, 10);
  });

  const [classTopic, setClassTopic] = useState<string>('Apresentação Inicial de Consultoria Organizacional (Encontro Inaugural)');
  const [totalMeetingMinutes, setTotalMeetingMinutes] = useState<number>(45); // Default to 45 min presentation today
  const [thresholdPercent, setThresholdPercent] = useState<number>(90); // 90%
  const [workspaceAccount] = useState<string>('Faculdade.faatesp@ibecensino.org.br');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedResults, setParsedResults] = useState<MeetParticipantResult[] | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const minRequiredMinutes = Math.round((totalMeetingMinutes * thresholdPercent) / 100);

  // Generate Sample Google Meet CSV Report for testing
  const handleDownloadSampleCsv = () => {
    const minMins = Math.round((totalMeetingMinutes * thresholdPercent) / 100);
    const rows = [
      ['Nome Completo', 'E-mail', 'Horario Entrada', 'Horario Saida', 'Tempo Permanencia (minutos)'],
    ];

    students.forEach((st, idx) => {
      // Alternate mock stay times for demonstration: most > 135 mins, some less
      const mockMins = idx % 5 === 4 ? 110 : idx % 5 === 3 ? 128 : 145 + (idx % 5);
      rows.push([
        st.name,
        st.email || `aluno${idx + 1}@exemplo.com.br`,
        '19:00:00',
        '21:30:00',
        String(mockMins),
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_google_meet_terca_${meetingDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate or Parse CSV
  const processParticipantData = (rawList: { name: string; email?: string; durationMins: number }[]) => {
    let currentStudents = [...students];
    const results: MeetParticipantResult[] = [];

    rawList.forEach((item) => {
      const cleanName = item.name.trim().toUpperCase();
      let matchedStudent = currentStudents.find(
        (s) => s.name.trim().toUpperCase() === cleanName
      );

      // Auto-register student if missing
      if (!matchedStudent) {
        const nextNum = currentStudents.length + 1;
        matchedStudent = {
          id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: cleanName,
          registrationId: `2026${String(nextNum).padStart(3, '0')}`,
          email: item.email || '',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        currentStudents.push(matchedStudent);
      }

      const percent = Math.min(100, Math.round((item.durationMins / totalMeetingMinutes) * 100));
      const status: AttendanceStatus = percent >= thresholdPercent ? 'present' : 'absent';

      results.push({
        studentName: matchedStudent.name,
        studentId: matchedStudent.id,
        email: item.email || matchedStudent.email,
        durationMinutes: item.durationMins,
        percentage: percent,
        status,
        matched: true,
      });
    });

    // Make sure all students from roster have a status
    students.forEach((st) => {
      const exists = results.some((r) => r.studentId === st.id);
      if (!exists) {
        results.push({
          studentName: st.name,
          studentId: st.id,
          email: st.email,
          durationMinutes: 0,
          percentage: 0,
          status: 'absent',
          matched: false,
        });
      }
    });

    return { results, updatedStudents: currentStudents };
  };

  // Handle CSV Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleParseCsv = () => {
    if (!csvFile) {
      setErrorMsg('Por favor, selecione um arquivo de relatório de presença do Google Meet (.csv ou .txt).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        const parsedItems: { name: string; email?: string; durationMins: number }[] = [];

        lines.forEach((line, index) => {
          if (index === 0 && (line.toLowerCase().includes('nome') || line.toLowerCase().includes('name'))) {
            return; // Skip CSV header line
          }
          const cols = line.split(/[,;\t]/).map((c) => c.replace(/"/g, '').trim());
          if (cols.length >= 2 && cols[0]) {
            const name = cols[0];
            const email = cols[1]?.includes('@') ? cols[1] : undefined;
            // Find column with duration
            let mins = 145; // default fallback
            for (let i = 1; i < cols.length; i++) {
              const val = parseInt(cols[i], 10);
              if (!isNaN(val) && val > 0 && val <= 300) {
                mins = val;
                break;
              }
            }
            parsedItems.push({ name, email, durationMins: mins });
          }
        });

        if (parsedItems.length === 0) {
          setErrorMsg('Não foi possível identificar dados de participantes no arquivo.');
          return;
        }

        const { results } = processParticipantData(parsedItems);
        setParsedResults(results);
        setSuccessMsg(`Relatório lido com sucesso! ${results.length} alunos analisados.`);
      } catch (err) {
        setErrorMsg('Erro ao ler o arquivo CSV. Verifique a formatação do relatório.');
      }
    };
    reader.readAsText(csvFile);
  };

  // Run Quick Simulation (Automatic Test without File)
  const handleRunSimulation = () => {
    if (students.length === 0) {
      setErrorMsg('Nenhum aluno cadastrado. Adicione os alunos reais no menu "Gestão de Alunos" ou faça o upload da planilha do Google Meet.');
      return;
    }

    const rawMock = students.map((st, idx) => {
      // Scale minutes based on totalMeetingMinutes
      // 85% of students stay full duration or >90%, ~15% leave early
      const isAbsent = idx % 6 === 5;
      const mins = isAbsent
        ? Math.floor(totalMeetingMinutes * 0.7) // ~70% duration (Absent < 90%)
        : Math.min(totalMeetingMinutes, Math.floor(totalMeetingMinutes * (0.92 + (idx % 3) * 0.03))); // 92% - 98% duration (Present)

      return {
        name: st.name,
        email: st.email,
        durationMins: mins,
      };
    });

    const { results } = processParticipantData(rawMock);
    setParsedResults(results);
    setSuccessMsg(`Simulação executada com sucesso! Frequência calculada para aula de ${totalMeetingMinutes} min (Mínimo 90%: ${minRequiredMinutes} min).`);
  };

  // Apply Results and Save as Class Session Roll Call
  const handleConfirmAndSaveSession = () => {
    if (!parsedResults || parsedResults.length === 0) return;

    // Build Roll Call Records object
    const records: Record<string, AttendanceStatus> = {};
    const notes: Record<string, string> = {};

    parsedResults.forEach((res) => {
      if (res.studentId) {
        records[res.studentId] = res.status;
        notes[res.studentId] = `Google Meet: Permanência de ${res.durationMinutes} min (${res.percentage}%)`;
      }
    });

    // Target Aula #1 explicitly
    const targetClass1 = existingClasses.find((c) => c.classNumber === 1 || c.id === 'class-1');
    const targetId = targetClass1 ? targetClass1.id : 'class-1';

    const newSession: ClassSession = {
      id: targetId,
      classNumber: 1,
      date: meetingDate,
      startTime: '19:00',
      endTime: totalMeetingMinutes === 45 ? '19:45' : totalMeetingMinutes === 60 ? '20:00' : '21:30',
      durationMinutes: totalMeetingMinutes,
      minRequiredMinutes,
      topic: classTopic || `Aula #1 - Apresentação Inicial de Consultoria Organizacional`,
      description: `Chamada realizada via Relatório de Permanência do Google Meet. Duração total: ${totalMeetingMinutes} min • Exigência de 90%: ${minRequiredMinutes} min.`,
      instructor: 'Professor Rogério Augusto Fernandes',
      records,
      recordNotes: notes,
      isClosed: true,
      createdAt: targetClass1?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onImportMeetSession(newSession);
    setSuccessMsg('Chamada salva e integrada com sucesso à matriz do curso!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const presentCount = parsedResults?.filter((r) => r.status === 'present').length || 0;
  const absentCount = parsedResults?.filter((r) => r.status === 'absent').length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6 text-slate-100 my-8 animate-scale-up">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-3 rounded-2xl">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Integração Google Meet</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Regra de 90% Ativa
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Processamento automático de permanência para as aulas de Terça-feira (19:00 às 21:30 hs)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Meeting Rules Config Box */}
        <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Configuração do Encontro / Aula</span>
            </h4>
            <span className="text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
              Conta: {workspaceAccount}
            </span>
          </div>

          {/* Quick Presets for Class Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Atalho de Duração de Aula:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(30);
                  setClassTopic('Aula de Consultoria (30 min)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 30
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                30 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(45);
                  setClassTopic('Aula de Consultoria (45 min)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 45
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                45 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(60);
                  setClassTopic('Aula de Consultoria (60 min)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 60
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                60 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(120);
                  setClassTopic('Aula de Consultoria (120 min)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 120
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                120 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(135);
                  setClassTopic('Aula de Consultoria (135 min)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 135
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                135 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotalMeetingMinutes(150);
                  setClassTopic('Consultoria Organizacional - Aula Regular (19:00 às 21:30)');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  totalMeetingMinutes === 150
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                }`}
              >
                150 min (Padrão 19h - 21h30)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Data do Encontro
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Duração Total Definida
              </label>
              <input
                type="number"
                value={totalMeetingMinutes}
                onChange={(e) => setTotalMeetingMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold"
              />
              <span className="text-[10px] text-slate-500">Minutos totais da sessão</span>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">
                Permanência Mínima (%)
              </label>
              <input
                type="number"
                value={thresholdPercent}
                onChange={(e) => setThresholdPercent(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold"
              />
              <span className="text-[10px] text-emerald-400 font-bold">
                Mínimo exato: {minRequiredMinutes} min ({thresholdPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Actions: Process File or Run Simulation */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Carregar Relatório do Google Meet (.csv / .txt)
              </label>
              <input
                type="file"
                accept=".csv, .txt, .xlsx"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleParseCsv}
              disabled={!csvFile}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 w-full sm:w-auto"
            >
              Processar Arquivo
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="text-slate-400 hover:text-indigo-400 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo de Relatório do Meet (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handleRunSimulation}
              className="text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Leitura Automática do Meet</span>
            </button>
          </div>
        </div>

        {/* Results Preview */}
        {parsedResults && parsedResults.length > 0 && (
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Resultado da Análise de Frequência</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Regra aplicada: Mínimo {minRequiredMinutes} min ({thresholdPercent}%). Presentes: {presentCount} • Ausentes: {absentCount}
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndSaveSession}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Chamada no Sistema</span>
              </button>
            </div>

            {/* Table of Processed Results */}
            <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60 divide-y divide-slate-800 text-xs">
              {parsedResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold w-5">{idx + 1}.</span>
                    <div>
                      <div className="font-bold text-slate-200">{res.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Permanência: {res.durationMinutes} min / {totalMeetingMinutes} min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                      {res.percentage}%
                    </span>

                    {res.status === 'present' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Ausente (&lt;90%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
