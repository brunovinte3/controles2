import React, { useState, useMemo } from 'react';
import { Employee, TrainingStatus, TrainingRecord, EmployeeSituation } from '../types';
import { NR_COURSES, STATUS_CONFIG, SITUATION_CONFIG } from '../constants';
import { getDaysRemaining } from '../utils/calculations';

interface ReportsProps {
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees }) => {
  const [filters, setFilters] = useState({
    company: '',
    setor: '',
    status: '' as TrainingStatus | '',
    situation: '' as EmployeeSituation | '',
    course: '',
    search: '',
    period: 'all' as 'all' | '15' | '30' | '60' | '90' | 'expired',
    realization: '' as 'realizado' | 'nao_realizado' | '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const companies = useMemo(() => Array.from(new Set(employees.map(e => e.company))), [employees]);
  const setores = useMemo(() => Array.from(new Set(employees.map(e => e.setor))), [employees]);

  const reportData = useMemo(() => {
    let result: any[] = [];
    employees.forEach(emp => {
      const trainingsObj = emp.trainings && typeof emp.trainings === 'object' ? emp.trainings : {};
      Object.entries(trainingsObj).forEach(([cid, record]) => {
        const t = record as TrainingRecord;
        if (!t) return;
        const days = getDaysRemaining(t.expiryDate);
        
        const matchesSearch = emp.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                             emp.registration.includes(filters.search);
        const matchesCompany = !filters.company || emp.company === filters.company;
        const matchesSetor = !filters.setor || emp.setor === filters.setor;
        const matchesStatus = !filters.status || t.status === filters.status;
        const matchesSituation = !filters.situation || emp.situation === filters.situation;
        const matchesCourse = !filters.course || cid === filters.course;

        let matchesPeriod = true;
        if (filters.period === 'expired') matchesPeriod = t.status === 'EXPIRED';

        let matchesRealization = true;
        if (filters.realization === 'realizado') {
          matchesRealization = t.status !== 'NOT_TRAINED';
        } else if (filters.realization === 'nao_realizado') {
          matchesRealization = t.status === 'NOT_TRAINED';
        }

        if (matchesSearch && matchesCompany && matchesSetor && matchesStatus && matchesSituation && matchesCourse && matchesPeriod && matchesRealization) {
          result.push({ employee: emp, courseId: cid, record: t, days });
        }
      });
    });
    return result;
  }, [employees, filters]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(reportData.length / pageSize));
  const pagedReportData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return reportData.slice(start, start + pageSize);
  }, [reportData, currentPage, pageSize]);

  // Estatísticas Dinâmicas do Relatório
  const stats = useMemo(() => {
    const uniqueEmployees = new Set(reportData.map(item => item.employee.registration)).size;
    const totalRecords = reportData.length;
    const valid = reportData.filter(item => item.record?.status === 'VALID').length;
    const expiring = reportData.filter(item => item.record?.status === 'EXPIRING').length;
    const expired = reportData.filter(item => item.record?.status === 'EXPIRED').length;

    return { uniqueEmployees, totalRecords, valid, expiring, expired };
  }, [reportData]);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn print:pb-0 print:space-y-0">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Relatórios & Auditoria Normativa</span>
            <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">SST Analytics</span>
          </h2>
          <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
            Filtragem detalhada por normas, empresa, setor e status de vencimento
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-[#5439C7] hover:bg-[#432CA5] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/30 transition-all flex items-center gap-2"
        >
          <span>🖨️</span> Exportar PDF / Imprimir
        </button>
      </div>

      {/* Header específico para impressão */}
      <div className="hidden print:block mb-8 p-8 bg-gray-50 border-b-2 border-gray-400">
        <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">ControlSST • Relatório de Auditoria</h1>
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600">
          <p>Empresa: {filters.company || 'Todas'}</p>
          <p className="text-right">Setor: {filters.setor || 'Todos'}</p>
          <p>Curso: {filters.course || 'Todas as NRs'}</p>
          <p className="text-right">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-white p-6 rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.1)] border border-[#ECEAF6] no-print space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EEF8] pb-3">
          <span className="text-xs font-black text-[#1A143E] uppercase tracking-wider flex items-center gap-2">
            <span>🔍</span> Filtros de Auditoria
          </span>
          <button 
            onClick={() => setFilters({ company: '', setor: '', status: '', situation: '', course: '', search: '', period: 'all', realization: '' })}
            className="text-[11px] font-bold text-[#7C74A7] hover:text-[#5439C7] transition-colors"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Empresa</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.company} 
              onChange={e => setFilters({...filters, company: e.target.value})}
            >
              <option value="">Todas as Empresas</option>
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Treinamento (NR)</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.course} 
              onChange={e => setFilters({...filters, course: e.target.value})}
            >
              <option value="">Todas as NRs</option>
              {NR_COURSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Setor</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.setor} 
              onChange={e => setFilters({...filters, setor: e.target.value})}
            >
              <option value="">Todos os Setores</option>
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Status</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.status} 
              onChange={e => setFilters({...filters, status: e.target.value as any})}
            >
              <option value="">Todos os Status</option>
              <option value="VALID">Válidos</option>
              <option value="EXPIRING">Vencendo (Alerta)</option>
              <option value="EXPIRED">Vencidos</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Situação</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.situation} 
              onChange={e => setFilters({...filters, situation: e.target.value as any})}
            >
              <option value="">Todas Situações</option>
              <option value="ATIVO">Ativo</option>
              <option value="AFASTADO">Afastado</option>
              <option value="DEMITIDO">Demitido</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Aproveitamento</label>
            <select 
              className="w-full bg-[#F5F4FC] hover:bg-[#EFEBF9] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none transition-all" 
              value={filters.realization} 
              onChange={e => setFilters({...filters, realization: e.target.value as any})}
            >
              <option value="">Todos</option>
              <option value="realizado">Realizado</option>
              <option value="nao_realizado">Não Realizado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7E77A9] uppercase mb-1.5">Pesquisa Direta</label>
            <input 
              type="text" 
              className="w-full bg-[#F5F4FC] border border-[#E1DCF5] rounded-xl p-2.5 text-xs font-bold text-[#1A143E] outline-none placeholder-[#9791BE] focus:bg-white focus:border-[#5439C7]" 
              placeholder="Nome ou RE..." 
              value={filters.search} 
              onChange={e => setFilters({...filters, search: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* BARRA DE RESUMO ESTATÍSTICO */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 no-print">
        <div className="bg-white p-4 px-5 rounded-2xl border border-[#ECEAF6] shadow-sm flex flex-col justify-center">
          <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Colaboradores</p>
          <p className="text-xl font-black text-[#181236]">{stats.uniqueEmployees}</p>
        </div>
        <div className="bg-white p-4 px-5 rounded-2xl border border-[#ECEAF6] shadow-sm flex flex-col justify-center">
          <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Total de Cursos</p>
          <p className="text-xl font-black text-[#181236]">{stats.totalRecords}</p>
        </div>
        <div className="bg-white p-4 px-5 rounded-2xl border border-[#ECEAF6] shadow-sm flex flex-col justify-center border-l-4 border-l-[#5439C7]">
          <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Válidos</p>
          <p className="text-xl font-black text-[#5439C7]">{stats.valid}</p>
        </div>
        <div className="bg-white p-4 px-5 rounded-2xl border border-[#ECEAF6] shadow-sm flex flex-col justify-center border-l-4 border-l-[#00D26A]">
          <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Em Alerta</p>
          <p className="text-xl font-black text-[#00B058]">{stats.expiring}</p>
        </div>
        <div className="bg-white p-4 px-5 rounded-2xl border border-[#ECEAF6] shadow-sm flex flex-col justify-center border-l-4 border-l-red-500">
          <p className="text-[9px] font-bold text-[#8680B0] uppercase tracking-wider">Vencidos</p>
          <p className="text-xl font-black text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* TABELA DE REGISTROS */}
      <div className="bg-white rounded-[2rem] shadow-[0_12px_35px_rgba(0,0,0,0.12)] overflow-hidden border border-[#ECEAF6] print:shadow-none print:border-none print:overflow-visible">
        <table className="w-full text-left print:text-black">
          <thead className="bg-[#241E54] text-white font-extrabold uppercase text-[9px] tracking-wider print:bg-gray-100 print:text-black print:border-b-2 print:border-gray-400">
            <tr>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">Situação</th>
              <th className="px-6 py-4">Treinamento / Setor</th>
              <th className="px-6 py-4">Vencimento</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEF8] print:divide-gray-300">
            {pagedReportData.length > 0 ? pagedReportData.map((item, idx) => (
              <tr key={idx} className="sst-table-row print:break-inside-avoid hover:bg-[#F9F8FD] transition-colors">
                <td className="px-6 py-4 text-[10px] font-bold text-[#553AC8]">{item.employee.company}</td>
                <td className="px-6 py-4">
                  <p className="font-extrabold text-[#181236] text-xs print:text-black">{item.employee.name}</p>
                  <p className="text-[9px] text-[#8680B0] font-bold">RE: {item.employee.registration}</p>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${SITUATION_CONFIG[item.employee.situation as EmployeeSituation]?.bg || 'bg-gray-100'} ${SITUATION_CONFIG[item.employee.situation as EmployeeSituation]?.text || 'text-gray-700'}`}>
                    {SITUATION_CONFIG[item.employee.situation as EmployeeSituation]?.label || item.employee.situation}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-extrabold text-[#5439C7] text-xs print:text-black">{item.courseId}</p>
                  <p className="text-[9px] text-[#8680B0] font-bold uppercase">{item.employee.setor}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-[#181236]">
                  {item.record.expiryDate ? new Date(item.record.expiryDate).toLocaleDateString('pt-BR') : '---'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider ${
                    item.record.status === 'VALID' ? 'bg-[#E6FAF0] text-[#00A850]' :
                    item.record.status === 'EXPIRING' ? 'bg-[#FDF3E7] text-[#C27803]' :
                    item.record.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_CONFIG[item.record.status as TrainingStatus]?.label || item.record.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <p className="text-[#8680B0] font-bold text-xs uppercase tracking-wider">Nenhum registro encontrado para os filtros aplicados</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* CONTROLES DE PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-[#FAF9FE] border-t border-[#ECEAF6] gap-3 no-print">
            <p className="text-xs font-semibold text-[#8B85B5]">
              Mostrando <span className="font-bold text-[#181236]">{(currentPage - 1) * pageSize + 1}</span> até <span className="font-bold text-[#181236]">{Math.min(currentPage * pageSize, reportData.length)}</span> de <span className="font-bold text-[#181236]">{reportData.length}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-[#DEDBF2] bg-white hover:bg-[#F2F0FB] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-[#5439C7] transition-all"
              >
                ◀ Anterior
              </button>
              <span className="text-xs font-extrabold text-[#181236] px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3.5 py-1.5 rounded-xl border border-[#DEDBF2] bg-white hover:bg-[#F2F0FB] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-[#5439C7] transition-all"
              >
                Próxima ▶
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden print:block mt-10 pt-6 border-t border-gray-300 text-center">
         <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">ControlSST • Gestão Normativa de SST</p>
      </div>
    </div>
  );
};

export default Reports;
