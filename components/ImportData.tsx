import React, { useState } from 'react';
import { formatEmployeeData } from '../utils/calculations';
import { Employee } from '../types';

interface ImportDataProps {
  onImport: (data: Employee[]) => void;
}

const ImportData: React.FC<ImportDataProps> = ({ onImport }) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState('');
  const [parsedEmployees, setParsedEmployees] = useState<Employee[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleProcess = () => {
    setSyncSuccess(false);
    try {
      const trimmedInput = inputText.trim();
      if (!trimmedInput) {
        setError('O campo está vazio. Copie os dados da sua planilha e cole aqui.');
        return;
      }

      const lines = trimmedInput.split(/\r?\n/);
      if (lines.length < 2) {
        setError('Dados insuficientes. Certifique-se de copiar o CABEÇALHO e as LINHAS da planilha.');
        return;
      }

      const firstLine = lines[0];
      let separator = '\t';
      if (!firstLine.includes('\t')) {
        if (firstLine.includes(';')) separator = ';';
        else if (firstLine.includes(',')) separator = ',';
      }

      const headers = lines[0].split(separator).map(h => h.trim());
      
      const rawData = lines.slice(1).map(line => {
        const values = line.split(separator).map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          const val = values[i];
          obj[h] = (val === '' || val === '-' || val?.toUpperCase() === 'N/A') ? undefined : val;
        });
        return obj;
      });

      const employees = formatEmployeeData(rawData);
      
      if (employees.length === 0 || employees.every(e => e.name === 'Sem Nome')) {
        setError('Não reconhecemos os nomes das colunas. Verifique se o cabeçalho inclui "Nome", "Matrícula" e as NRs.');
        return;
      }

      setParsedEmployees(employees);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro crítico ao processar texto.');
    }
  };

  const handleSync = async () => {
    if (parsedEmployees.length === 0) return;
    setIsProcessing(true);
    setError('');
    try {
      await onImport(parsedEmployees);
      setSyncSuccess(true);
      setParsedEmployees([]);
      setInputText('');
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (err: any) {
      setError(`Erro ao sincronizar: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setParsedEmployees([]);
    setError('');
    setSyncSuccess(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn space-y-6 pb-20">
      {/* Header */}
      <div className="bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Importar Planilha em Lote</span>
            <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">Upload CSV / TSV</span>
          </h2>
          <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
            Cole os dados da sua planilha Excel ou Google Sheets para sincronização instantânea
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleClear} 
            className="px-4 py-2 bg-[#2C2465] text-[#A59FD3] hover:text-white rounded-xl font-bold text-xs uppercase transition-colors"
          >
            Limpar
          </button>
          <button 
            onClick={handleProcess} 
            className="px-4 py-2 bg-[#5439C7] hover:bg-[#432CA5] text-white rounded-xl font-bold text-xs uppercase shadow-md transition-colors"
          >
            Processar Dados
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-[#ECEAF6] space-y-6">
        <textarea
          className="w-full h-80 p-6 bg-[#F8F7FD] border border-[#DDD7F4] focus:border-[#5439C7] rounded-2xl font-mono text-xs text-[#181236] outline-none transition-all resize-none shadow-inner placeholder-[#9E97C7]"
          placeholder="Copie as linhas da planilha com o cabeçalho (Ctrl+C) e cole aqui (Ctrl+V)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold leading-relaxed animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        {syncSuccess && (
          <div className="p-4 bg-[#E6FAF0] border border-[#BDEECF] text-[#00A850] rounded-xl flex items-center justify-center gap-3 font-bold text-xs animate-fadeIn">
            <span>✅</span>
            <span>Sincronização com o banco de dados concluída com sucesso!</span>
          </div>
        )}

        {parsedEmployees.length > 0 && !syncSuccess && (
          <div className="p-6 bg-[#F8F7FD] rounded-2xl border border-[#ECEAF6] space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm text-[#181236]">Prévia de Importação</h4>
                <p className="text-[10px] text-[#5439C7] font-bold uppercase">{parsedEmployees.length} registros prontos para inserção</p>
              </div>
              <button 
                onClick={handleSync} 
                disabled={isProcessing} 
                className="px-6 py-3 bg-[#00D26A] hover:bg-[#00B85C] text-[#140F30] rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Sincronizando...' : 'Gravar no Banco ☁️'}
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
              {parsedEmployees.slice(0, 10).map((emp, i) => (
                <div key={i} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-[#ECEAF6]">
                  <span className="font-bold text-[#181236] uppercase">{emp.name}</span>
                  <span className="font-medium text-[#7C74A7]">RE: {emp.registration} • {emp.setor}</span>
                </div>
              ))}
              {parsedEmployees.length > 10 && (
                <p className="text-center text-[10px] text-[#7C74A7] font-bold pt-1">
                  + {parsedEmployees.length - 10} outros registros
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportData;
