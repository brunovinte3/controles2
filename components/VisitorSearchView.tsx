import React, { useState, useMemo, useEffect } from 'react';
import { Employee, TrainingStatus } from '../types';
import { STATUS_CONFIG, NR_COURSES, SITUATION_CONFIG } from '../constants';
import { getDaysRemaining } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface VisitorSearchViewProps {
  employees: Employee[];
}

const VisitorSearchView: React.FC<VisitorSearchViewProps> = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(StorageService.getLastSyncTime());

  useEffect(() => {
    setLastSync(StorageService.getLastSyncTime());
  }, [employees]);

  const selectedEmployee = useMemo(() => {
    if (!selectedId) return null;
    return employees.find(e => e.id === selectedId) || null;
  }, [employees, selectedId]);

  const normalize = (text: string) => 
    text.toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

  const searchResults = useMemo(() => {
    const term = normalize(searchTerm);
    if (term.length < 2) return [];
    
    return employees.filter(emp => {
      const name = normalize(emp.name || '');
      const reg = normalize(emp.registration || '');
      return name.includes(term) || reg.includes(term);
    }).slice(0, 5);
  }, [employees, searchTerm]);

  const handleSelect = (emp: Employee) => {
    setSelectedId(emp.id);
    setSearchTerm('');
  };

  const isCipero = (emp: Employee) => ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR05']?.status);
  const isBrigadista = (emp: Employee) => 
    ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR23']?.status) ||
    ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR23QC']?.status) ||
    ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR23MEC']?.status);

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header */}
      <div className="no-print bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Consulta Rápida de Colaborador</span>
            <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">Busca Instantânea</span>
          </h2>
          <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
            Verificação de conformidade e validade de treinamentos em tempo real
          </p>
        </div>
        <span className="text-[10px] text-[#A59FD3] font-mono">
          {lastSync ? `Sinc: ${lastSync}` : 'Base Atualizada'}
        </span>
      </div>

      {/* Input de Busca em Destaque */}
      <div className="max-w-2xl mx-auto space-y-3 no-print">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Digite o Nome ou RE do colaborador..." 
            className="w-full px-8 py-5 bg-white border-2 border-[#E1DCF5] focus:border-[#5439C7] rounded-[2rem] text-sm font-bold text-[#181236] placeholder-[#948DBF] shadow-[0_10px_35px_rgba(0,0,0,0.08)] outline-none transition-all text-center focus:ring-4 focus:ring-[#5439C7]/15"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-[#7E77A9]">🔍</span>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.75rem] shadow-2xl border border-[#E1DCF5] overflow-hidden z-50 animate-fadeIn divide-y divide-[#F0EEF8]">
              {searchResults.map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  className="w-full p-4 px-6 flex items-center justify-between hover:bg-[#F6F4FD] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#ECE8FC] text-[#5439C7] rounded-full flex items-center justify-center font-black text-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-[#181236] uppercase">{emp.name}</p>
                      <p className="text-[10px] font-bold text-[#8680B0] tracking-wide">RE: {emp.registration} • {emp.setor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase">
                      {emp.situation}
                    </span>
                    {isCipero(emp) && <span className="w-6 h-6 bg-[#00D26A] text-white rounded flex items-center justify-center text-[9px] font-black">C</span>}
                    {isBrigadista(emp) && <span className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-[9px] font-black">B</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEmployee ? (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-[#ECEAF6] overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
            
            {/* Header da Ficha do Trabalhador */}
            <div className="p-8 md:p-10 bg-[#F9F8FD] flex flex-col md:flex-row items-center gap-6 border-b border-[#ECEAF6] relative">
              
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white border-2 border-[#DFD9F5] shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selectedEmployee.photoUrl ? (
                  <img src={selectedEmployee.photoUrl} alt={selectedEmployee.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl text-[#5439C7] font-black">
                    {selectedEmployee.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-[#181236] uppercase tracking-tight">
                    {selectedEmployee.name}
                  </h3>
                  <span className="bg-[#5439C7] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">
                    RE: {selectedEmployee.registration}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-200 text-gray-800">
                    {selectedEmployee.situation}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Empresa / Unidade</p>
                    <p className="text-sm font-extrabold text-[#181236]">{selectedEmployee.company || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Setor & Função</p>
                    <p className="text-sm font-extrabold text-[#181236]">{selectedEmployee.setor} • {selectedEmployee.role}</p>
                  </div>
                </div>
              </div>

              <div className="no-print">
                 <button 
                  onClick={() => window.print()}
                  className="bg-[#5439C7] hover:bg-[#442DA8] text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/25 active:scale-95 transition-all flex items-center gap-2"
                 >
                   <span>🖨️</span> Imprimir Ficha
                 </button>
              </div>
            </div>

            {/* Tabela de Treinamentos */}
            <div className="p-6 md:p-8 overflow-x-auto">
              <h4 className="text-xs font-black text-[#181236] uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#5439C7] rounded-full"></span>
                Grade de Treinamentos e NRs Vinculadas
              </h4>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#ECEAF6] text-[10px] font-bold uppercase text-[#8680B0]">
                    <th className="pb-3 pr-4">Treinamento</th>
                    <th className="pb-3 px-4">Conclusão</th>
                    <th className="pb-3 px-4">Validade</th>
                    <th className="pb-3 px-4 text-center">Dias Restantes</th>
                    <th className="pb-3 pl-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F0FA]">
                  {NR_COURSES.map(course => {
                    const training = selectedEmployee.trainings?.[course.id];
                    const status = training?.status || 'NOT_TRAINED';
                    const days = getDaysRemaining(training?.expiryDate);
                    
                    return (
                      <tr key={course.id} className="hover:bg-[#F9F8FD] transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-xs font-black text-[#181236] uppercase">{course.id}</p>
                          <p className="text-[10px] font-semibold text-[#8680B0] leading-none mt-0.5">{course.name}</p>
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-[#181236]">
                          {training?.completionDate ? new Date(training.completionDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-4 px-4 text-xs font-bold text-[#181236]">
                          {training?.expiryDate ? new Date(training.expiryDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-[10px] font-black uppercase ${days !== null && days < 0 ? 'text-red-500' : 'text-[#00A850]'}`}>
                            {days !== null ? (days < 0 ? `Vencido (${Math.abs(days)}d)` : `${days} dias`) : '-'}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider ${
                            status === 'VALID' ? 'bg-[#E6FAF0] text-[#00A850]' :
                            status === 'EXPIRING' ? 'bg-[#FDF3E7] text-[#C27803]' :
                            status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {STATUS_CONFIG[status as TrainingStatus]?.label || status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-[#9E98D0] no-print">
           <div className="w-24 h-24 bg-[#2C2465] rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-xl border border-[#3D3384]">
             👷‍♂️
           </div>
           <p className="font-extrabold uppercase text-xs tracking-widest text-white">
             Digite o nome ou RE acima para consultar o colaborador
           </p>
        </div>
      )}
    </div>
  );
};

export default VisitorSearchView;
