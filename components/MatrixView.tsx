import React from 'react';
import { NR_COURSES } from '../constants';

const MatrixView: React.FC = () => {
  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#251F56]/60 backdrop-blur-md p-4 px-6 rounded-2xl border border-[#3A307E]/70">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Matriz Técnica de Cursos & NRs</span>
          <span className="text-xs bg-[#5439C7] text-white px-2.5 py-0.5 rounded-full font-bold">Diretrizes MTE</span>
        </h2>
        <p className="text-xs text-[#A59FD3] font-medium mt-0.5">
          Detalhamento de Carga Horária, Validades Normativas e Escopo Técnico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {NR_COURSES.map(course => (
          <div 
            key={course.id} 
            className="bg-white p-6 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-[#ECEAF6] flex flex-col hover:shadow-xl hover:border-[#5439C7]/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#ECE8FC] text-[#5439C7] px-3.5 py-1.5 rounded-xl font-extrabold text-xs group-hover:bg-[#5439C7] group-hover:text-white transition-colors">
                {course.id}
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-[#8680B0] uppercase">Validade</span>
                <span className="font-extrabold text-[#181236] text-xs">
                  {course.validityYears ? `${course.validityYears} ${course.validityYears > 1 ? 'Anos' : 'Ano'}` : 'Pontual (Sem Exp.)'}
                </span>
              </div>
            </div>

            <h3 className="text-base font-extrabold text-[#181236] mb-2 leading-tight">
              {course.name}
            </h3>
            
            <p className="text-xs text-[#716A9E] font-medium leading-relaxed mb-5 flex-1">
              {course.description || 'Treinamento regulamentado pelo Ministério do Trabalho e Emprego para conformidade legal.'}
            </p>

            <div className="pt-4 border-t border-[#F0EEF8] flex justify-between items-center">
              <div>
                <span className="block text-[8px] font-bold text-[#8680B0] uppercase tracking-wider">Carga Horária</span>
                <span className="font-extrabold text-[#5439C7] text-xs">{course.workload || 'Conforme Norma'}</span>
              </div>
              <div className="bg-[#E6FAF0] text-[#00A850] px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider">
                ● Norma Vigente
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner de Chamado SESMT */}
      <div className="bg-[#241E54] text-white p-8 rounded-[2rem] shadow-2xl border border-[#3C3284] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h4 className="text-xl font-black mb-1.5 tracking-tight flex items-center gap-2">
            <span>Necessita de Treinamento Customizado?</span>
            <span>⛑️</span>
          </h4>
          <p className="text-[#A59FD3] text-xs font-medium max-w-2xl">
            As validades e cargas horárias acima seguem rigorosamente a legislação ministerial de SST. Para treinamentos in-company, reciclagens ou integrações especiais, contate o setor de SESMT.
          </p>
        </div>
        <button className="bg-[#00D26A] hover:bg-[#00B85C] text-[#120E2D] px-8 py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all">
          Consultar SESMT
        </button>
      </div>
    </div>
  );
};

export default MatrixView;
