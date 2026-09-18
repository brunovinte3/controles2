import React, { useState, useMemo } from 'react';
import { Employee, EmployeeSituation } from '../types';
import { STATUS_CONFIG, NR_COURSES, SITUATION_CONFIG } from '../constants';
import { calculateTrainingStatus, getExpiryDate, getDaysRemaining, formatEmployeeData } from '../utils/calculations';
import { StorageService } from '../services/storage';

interface EmployeeViewProps {
  employees: Employee[];
  onUpdate: () => void;
  isAdmin: boolean;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ employees, onUpdate, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('TODOS');
  const [selectedCompany, setSelectedCompany] = useState('TODAS');
  const [selectedSituation, setSelectedSituation] = useState<'TODAS' | EmployeeSituation>('TODAS');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  
  // Estados para Importação em Massa
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Employee[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Normalização para buscas e filtros
  const simplify = (text: any) => 
    String(text || '')
      .toUpperCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Listas para os filtros
  const companies = useMemo(() => {
    const set = new Set(employees.map(e => simplify(e.company || 'EMPRESA PADRÃO')));
    return ['TODAS', ...Array.from(set)].sort();
  }, [employees]);

  const setores = useMemo(() => {
    const pool = selectedCompany === 'TODAS' 
      ? employees 
      : employees.filter(e => simplify(e.company) === selectedCompany);
    
    const set = new Set(pool.map(e => simplify(e.setor || 'GERAL')));
    return ['TODOS', ...Array.from(set)].sort();
  }, [employees, selectedCompany]);

  // Lógica de Filtragem e Ordenação Alfabética
  const filteredEmployees = useMemo(() => {
    const term = simplify(searchTerm);
    return employees
      .filter(emp => {
        const empComp = simplify(emp.company || 'EMPRESA PADRÃO');
        const empSet = simplify(emp.setor || 'GERAL');
        const empName = simplify(emp.name);
        const empReg = simplify(emp.registration);

        const matchesCompany = selectedCompany === 'TODAS' || empComp === selectedCompany;
        const matchesSetor = selectedSetor === 'TODOS' || empSet === selectedSetor;
        const matchesSituation = selectedSituation === 'TODAS' || emp.situation === selectedSituation;
        const matchesSearch = !term || empName.includes(term) || empReg.includes(term);

        return matchesCompany && matchesSetor && matchesSituation && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, selectedCompany, selectedSetor, selectedSituation]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, selectedSetor, selectedSituation]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pagedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const isCipero = (emp: Employee) => ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR05']?.status);
  const isBrigadista = (emp: Employee) => ['VALID', 'EXPIRING'].includes(emp.trainings?.['NR23']?.status);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    try {
      await StorageService.updateEmployee(editingEmp);
      setEditingEmp(null);
      onUpdate();
    } catch (err) {
      alert("Erro ao salvar dados do funcionário.");
    }
  };

  const updateTrainingDate = (courseId: string, completionDate: string) => {
    if (!editingEmp) return;

    const course = NR_COURSES.find(c => c.id === courseId);
    if (!course) return;

    const expiryDate = completionDate ? getExpiryDate(completionDate, course.validityYears) : undefined;
    const status = calculateTrainingStatus(completionDate || undefined, course.validityYears);

    setEditingEmp({
      ...editingEmp,
      trainings: {
        ...editingEmp.trainings,
        [courseId]: {
          courseId,
          completionDate: completionDate || undefined,
          expiryDate,
          status
        }
      }
    });
  };

  const handleProcessBulk = () => {
    try {
      const trimmed = importText.trim();
      if (!trimmed) return;
      const lines = trimmed.split(/\r?\n/);
      if (lines.length < 2) return;

      let separator = '\t';
      if (!lines[0].includes('\t')) {
        if (lines[0].includes(';')) separator = ';';
        else if (lines[0].includes(',')) separator = ',';
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

      const parsed = formatEmployeeData(rawData);
      setImportPreview(parsed);
    } catch (err) {
      alert("Erro ao processar o texto colado. Verifique as colunas.");
    }
  };

  const handleSaveBulk = async () => {
    if (!importPreview.length) return;
    setIsImporting(true);
    try {
      await StorageService.saveEmployees(importPreview);
      setImportPreview([]);
      setImportText('');
      setShowBulkImport(false);
      onUpdate();
      alert(`${importPreview.length} registros atualizados!`);
    } catch (err) {
      alert("Erro na sincronização.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Gestão de Funcionários & Prontuários</span>
            <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">Cloud Ativo</span>
          </h2>
          <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
            Cadastro, atualização de cursos e importação em massa
          </p>
        </div>
        <div className="flex gap-2.5 w-full md:w-auto">
          <button 
            onClick={() => setShowBulkImport(true)}
            className="flex-1 md:flex-none bg-[#2C2465] text-[#B5AFE0] hover:text-white border border-[#3F3488] px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#392F82] transition-all"
          >
            📥 Importar Dados
          </button>
          <button 
            onClick={() => setEditingEmp({ id: `NEW-${Date.now()}`, name: '', registration: '', role: '', setor: '', company: '', situation: 'ATIVO', trainings: {} })}
            className="flex-1 md:flex-none bg-[#5439C7] hover:bg-[#442DA8] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-950/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>➕ Novo Colaborador</span>
          </button>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white p-6 rounded-[2rem] border border-[#ECEAF6] shadow-[0_10px_35px_rgba(0,0,0,0.08)] space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Pesquise por nome ou matrícula..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#F4F3FB] border border-[#E1DCF5] focus:border-[#5439C7] rounded-xl text-xs font-bold text-[#181236] outline-none transition-all placeholder-[#918AB8]" 
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8780B3]">🔍</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-[#7E77A9] uppercase mb-1">Empresa</label>
            <select 
              value={selectedCompany} 
              onChange={(e) => { setSelectedCompany(e.target.value); setSelectedSetor('TODOS'); }} 
              className="w-full bg-[#F4F3FB] border border-[#E1DCF5] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#181236] outline-none cursor-pointer"
            >
              {companies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#7E77A9] uppercase mb-1">Setor</label>
            <select 
              value={selectedSetor} 
              onChange={(e) => setSelectedSetor(e.target.value)} 
              className="w-full bg-[#F4F3FB] border border-[#E1DCF5] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#181236] outline-none cursor-pointer"
            >
              {setores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-[#7E77A9] uppercase mb-1">Situação</label>
            <select 
              value={selectedSituation} 
              onChange={(e) => setSelectedSituation(e.target.value as any)} 
              className="w-full bg-[#F4F3FB] border border-[#E1DCF5] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#181236] outline-none cursor-pointer"
            >
              <option value="TODAS">TODAS AS SITUAÇÕES</option>
              <option value="ATIVO">ATIVO</option>
              <option value="AFASTADO">AFASTADO</option>
              <option value="DEMITIDO">DEMITIDO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Funcionários */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-[#ECEAF6] shadow-sm">
          <p className="text-4xl mb-2">🔍</p>
          <p className="text-sm font-extrabold text-[#181236]">Nenhum colaborador encontrado</p>
          <p className="text-xs text-[#8680B0] mt-1">Tente ajustar os filtros ou o termo de busca.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pagedEmployees.map(emp => (
              <div key={emp.id} className="bg-white p-5 rounded-[1.75rem] border border-[#ECEAF6] hover:border-[#5439C7]/40 hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                  <div className="flex gap-1.5">
                    {isCipero(emp) && <div className="w-6 h-6 bg-[#00D26A] text-white rounded-lg flex items-center justify-center font-black text-[9px] shadow-sm">C</div>}
                    {isBrigadista(emp) && <div className="w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center font-black text-[9px] shadow-sm">B</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${SITUATION_CONFIG[emp.situation]?.bg || 'bg-gray-100'} ${SITUATION_CONFIG[emp.situation]?.text || 'text-gray-700'}`}>
                    {SITUATION_CONFIG[emp.situation]?.label || emp.situation}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#ECE8FC] text-[#5439C7] rounded-2xl overflow-hidden border border-[#DDD8F4] flex items-center justify-center flex-shrink-0 font-extrabold text-lg">
                    {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : emp.name.charAt(0)}
                  </div>
                  <div className="min-w-0 pr-12">
                    <h3 className="text-xs font-black text-[#181236] uppercase truncate leading-tight mb-0.5">{emp.name}</h3>
                    <p className="text-[10px] font-bold text-[#5439C7]">RE: {emp.registration}</p>
                    <p className="text-[9px] font-medium text-[#8680B0] uppercase truncate mt-0.5">{emp.setor} • {emp.role}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setEditingEmp(emp)} 
                  className="w-full py-2.5 bg-[#F4F3FB] hover:bg-[#5439C7] text-[#5439C7] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  ✏️ Editar Prontuário
                </button>
              </div>
            ))}
          </div>

          {/* CONTROLES DE PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white rounded-2xl border border-[#ECEAF6] shadow-sm gap-3">
              <p className="text-xs font-semibold text-[#8B85B5]">
                Mostrando <span className="font-bold text-[#181236]">{(currentPage - 1) * pageSize + 1}</span> até <span className="font-bold text-[#181236]">{Math.min(currentPage * pageSize, filteredEmployees.length)}</span> de <span className="font-bold text-[#181236]">{filteredEmployees.length}</span> colaboradores
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-[#DEDBF2] bg-[#F4F3FB] hover:bg-[#EAE6F8] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-[#5439C7] transition-all"
                >
                  ◀ Anterior
                </button>
                <span className="text-xs font-extrabold text-[#181236] px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-[#DEDBF2] bg-[#F4F3FB] hover:bg-[#EAE6F8] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-[#5439C7] transition-all"
                >
                  Próxima ▶
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingEmp && (
        <div className="fixed inset-0 bg-[#140F30]/80 backdrop-blur-xl z-[1200] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden mt-8 mb-16 animate-fadeIn border border-[#ECEAF6]">
            <header className="p-6 px-8 border-b border-[#ECEAF6] flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-black text-[#181236] tracking-tight">Ficha do Colaborador</h3>
                <p className="text-[10px] font-bold text-[#8680B0] uppercase tracking-wider">Edição de dados cadastrais e validades de treinamentos</p>
              </div>
              <button 
                onClick={() => setEditingEmp(null)} 
                className="w-10 h-10 flex items-center justify-center bg-[#F4F3FB] text-[#7871A2] hover:bg-red-500 hover:text-white rounded-xl font-bold transition-colors"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSaveEdit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: 'Nome Completo', key: 'name', type: 'text' },
                  { label: 'Matrícula / RE', key: 'registration', type: 'text' },
                  { label: 'Unidade / Empresa', key: 'company', type: 'text' },
                  { label: 'Setor de Trabalho', key: 'setor', type: 'text' },
                  { label: 'Cargo / Função', key: 'role', type: 'text' },
                  { label: 'Situação do Trabalhador', key: 'situation', type: 'select' },
                  { label: 'URL da Foto', key: 'photoUrl', type: 'text' }
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#7A72A3] uppercase tracking-wider ml-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        className="w-full bg-[#F4F3FB] border border-[#E1DCF5] focus:border-[#5439C7] rounded-xl p-3 text-xs font-bold text-[#181236] outline-none transition-all"
                        value={(editingEmp as any)[field.key] || 'ATIVO'}
                        onChange={e => setEditingEmp({...editingEmp, [field.key]: e.target.value as any})}
                      >
                        <option value="ATIVO">ATIVO</option>
                        <option value="AFASTADO">AFASTADO</option>
                        <option value="DEMITIDO">DEMITIDO</option>
                      </select>
                    ) : (
                      <input 
                        required={field.key !== 'photoUrl'}
                        className="w-full bg-[#F4F3FB] border border-[#E1DCF5] focus:border-[#5439C7] rounded-xl p-3 text-xs font-bold text-[#181236] outline-none transition-all" 
                        value={(editingEmp as any)[field.key] || ''} 
                        onChange={e => setEditingEmp({...editingEmp, [field.key]: e.target.value})} 
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-[#ECEAF6]">
                <h4 className="text-xs font-black text-[#181236] uppercase tracking-wider mb-5">Datas de Conclusão de Treinamentos (NRs)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {NR_COURSES.map(course => (
                    <div key={course.id} className="bg-[#F8F7FD] p-3.5 rounded-2xl border border-[#ECEAF6]">
                      <label className="block text-[9px] font-bold text-[#5439C7] uppercase mb-2 truncate">{course.name}</label>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-[#E1DCF5] rounded-xl p-2 text-xs font-bold text-[#181236] outline-none focus:border-[#5439C7]" 
                        value={editingEmp.trainings?.[course.id]?.completionDate || ''} 
                        onChange={e => updateTrainingDate(course.id, e.target.value)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <footer className="pt-6 border-t border-[#ECEAF6] flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setEditingEmp(null)} 
                  className="flex-1 py-3.5 text-[#7A72A3] hover:text-[#181236] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-3.5 bg-[#5439C7] hover:bg-[#432CA5] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-950/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Salvar Dados</span>
                  <span>💾</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-[#140F30]/80 backdrop-blur-xl z-[1300] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn border border-[#ECEAF6]">
            <header className="p-6 px-8 border-b border-[#ECEAF6] flex justify-between items-center bg-white">
              <h3 className="text-xl font-black text-[#181236]">Importação de Dados da Planilha</h3>
              <button 
                onClick={() => setShowBulkImport(false)} 
                className="w-10 h-10 flex items-center justify-center bg-[#F4F3FB] text-[#7871A2] rounded-xl hover:bg-red-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </header>
            <div className="p-8 space-y-6 overflow-y-auto">
              <textarea 
                className="w-full h-72 p-5 bg-[#F4F3FB] border border-[#E1DCF5] rounded-2xl font-mono text-xs text-[#181236] outline-none focus:bg-white focus:border-[#5439C7] transition-all" 
                placeholder="Cole os dados tabulados da planilha aqui..." 
                value={importText} 
                onChange={(e) => setImportText(e.target.value)} 
              />
              <div className="flex justify-between items-center bg-[#F9F8FD] p-4 px-6 rounded-2xl border border-[#ECEAF6]">
                <p className="text-xs font-bold text-[#5439C7] uppercase">{importPreview.length} Registros Processados</p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleProcessBulk} 
                    className="px-5 py-2.5 bg-[#ECE8FC] text-[#5439C7] hover:bg-[#DFD9F8] rounded-xl font-bold text-xs uppercase transition-colors"
                  >
                    Processar Texto
                  </button>
                  <button 
                    onClick={handleSaveBulk} 
                    disabled={!importPreview.length || isImporting} 
                    className="px-6 py-2.5 bg-[#5439C7] hover:bg-[#432CA5] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-40 transition-all"
                  >
                    {isImporting ? 'Salvando...' : 'Sincronizar Cloud ☁️'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeView;
