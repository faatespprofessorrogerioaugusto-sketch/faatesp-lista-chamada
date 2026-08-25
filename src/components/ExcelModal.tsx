import React, { useState } from 'react';
import { Student, ClassSession } from '../types';
import { exportToExcel, downloadExcelTemplate, importStudentsFromExcel } from '../utils/excelUtils';
import {
  FileSpreadsheet,
  Download,
  Upload,
  X,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';

interface ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: ClassSession[];
  onImportStudents: (imported: Student[]) => void;
}

export const ExcelModal: React.FC<ExcelModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  onImportStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportToExcel(students, classes, 'Consultoria Organizacional');
    setSuccessMessage('Planilha Excel (.xlsx) gerada e baixada com sucesso!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const importedStudents = await importStudentsFromExcel(file);
      if (importedStudents.length === 0) {
        setErrorMessage('Nenhum aluno válido encontrado na planilha. Verifique o modelo.');
      } else {
        onImportStudents(importedStudents);
        setSuccessMessage(`${importedStudents.length} alunos importados com sucesso!`);
        setFile(null);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao ler a planilha Excel. Verifique se o formato do arquivo é válido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 animate-scale-up space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Integração com Planilha Excel</h3>
              <p className="text-xs text-slate-400">
                Exportação de relatório oficial e importação de alunos via Excel (.xlsx)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: Export Complete Attendance Matrix */}
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar Dados Atuais para Excel (.xlsx)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Gera uma pasta de trabalho Excel com 3 abas: <strong>Matriz de Chamada (P/A/J)</strong>, <strong>Resumo de Alunos</strong> e <strong>Histórico de Aulas</strong>.
              </p>
            </div>
            <button
              onClick={handleExport}
              id="modal-export-btn"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Exportar Agora
            </button>
          </div>
        </div>

        {/* Section 2: Import Students from Excel */}
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-800/40">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Importar Lista de Alunos via Excel</span>
              </h4>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                id="modal-download-template-btn"
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline cursor-pointer"
              >
                Baixar Modelo Excel (.xlsx)
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selecione uma planilha contendo as colunas: <strong>Matrícula</strong>, <strong>Nome do Aluno</strong> e <strong>Email</strong>.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/60 rounded-xl p-4 text-center">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                id="excel-file-input"
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer"
              />
              {file && (
                <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Arquivo selecionado: {file.name}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || !file}
                id="modal-import-submit-btn"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {loading ? 'Importando...' : 'Carregar e Importar Alunos'}
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
