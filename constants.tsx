
import { NRCourse, EmployeeSituation } from './types';

export const NR_COURSES: NRCourse[] = [
  { 
    id: 'NR05', 
    name: 'NR 05 - CIPA', 
    validityYears: 1, 
    workload: '20h', 
    description: 'Comissão Interna de Prevenção de Acidentes. Foca na prevenção de acidentes e doenças decorrentes do trabalho.' 
  },
  { 
    id: 'NR06', 
    name: 'NR 06 - EPI', 
    validityYears: null, 
    workload: '4h', 
    description: 'Equipamento de Proteção Individual. Orientações sobre o uso, guarda e conservação de EPIs.' 
  },
  { 
    id: 'NR10', 
    name: 'NR 10 - Elétrica', 
    validityYears: 2, 
    workload: '40h', 
    description: 'Segurança em Instalações e Serviços em Eletricidade. Requisitos mínimos para segurança de trabalhadores.' 
  },
  { 
    id: 'NR11', 
    name: 'NR 11 - Transportes', 
    validityYears: 1, 
    workload: '16h', 
    description: 'Transporte, Movimentação, Armazenagem e Manuseio de Materiais. Focado em máquinas como empilhadeiras.' 
  },
  { 
    id: 'NR12', 
    name: 'NR 12 - Máquinas', 
    validityYears: 2, 
    workload: '16h', 
    description: 'Segurança no Trabalho em Máquinas e Equipamentos. Referências técnicas e medidas de proteção.' 
  },
  { 
    id: 'NR13VP', 
    name: 'NR 13 - Vasos de Pressão', 
    validityYears: 1, 
    workload: '40h', 
    description: 'Estabelece requisitos para a integridade estrutural de vasos de pressão e suas inspeções.' 
  },
  { 
    id: 'NR13CL', 
    name: 'NR 13 - Caldeiras', 
    validityYears: 1, 
    workload: '40h', 
    description: 'Normas de segurança para operação e manutenção de caldeiras a vapor.' 
  },
  { 
    id: 'NR18', 
    name: 'NR 18 - Construção', 
    validityYears: 2, 
    workload: '4h a 16h', 
    description: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção. Diretrizes de ordem administrativa, de planejamento e de organização.' 
  },
  { 
    id: 'NR20', 
    name: 'NR 20 - Inflamáveis', 
    validityYears: 1, 
    workload: '8h a 32h', 
    description: 'Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis.' 
  },
  { 
    id: 'NR23', 
    name: 'NR 23 - Incêndio', 
    validityYears: 1, 
    workload: '8h', 
    description: 'Proteção Contra Incêndios. Medidas de prevenção e procedimentos de emergência.' 
  },
  { 
    id: 'NR26', 
    name: 'NR 26 - Sinalização', 
    validityYears: null, 
    workload: '4h', 
    description: 'Sinalização de Segurança. Estabelece padrões de cores e avisos para identificar perigos no ambiente laboral.' 
  },
  { 
    id: 'NR31', 
    name: 'NR 31 - Agrícola e Florestal', 
    validityYears: 2, 
    workload: '24h', 
    description: 'Segurança e Saúde no Trabalho na Agricultura, Pecuária, Silvicultura, Exploração Florestal e Aquicultura.' 
  },
  { 
    id: 'NR315', 
    name: 'NR31.5 Comissão Interna de Prevenção de Acidentes do Trabalho Rural - CIPATR', 
    validityYears: 2, 
    workload: '20h', 
    description: 'Focado na prevenção de acidentes e doenças no trabalho rural.' 
  },
  { 
    id: 'NR317', 
    name: 'NR31.7 Agrotóxicos, Aditivos, Adjuvantes e Produtos Afins', 
    validityYears: 2, 
    workload: '16h', 
    description: 'Segurança e saúde no manuseio de agrotóxicos no trabalho rural.' 
  },
  { 
    id: 'NR3112', 
    name: 'NR31.12 Segurança no Trabalho em Máquinas, Equipamentos e Implementos', 
    validityYears: 1, 
    workload: '24h', 
    description: 'Segurança na operação de máquinas e implementos agrícolas conforme NR-31.' 
  },
  { 
    id: 'NR32', 
    name: 'NR 32 - Serviços de Saúde', 
    validityYears: 2, 
    workload: '32h', 
    description: 'Segurança e Saúde no Trabalho em Serviços de Saúde. Foca em riscos biológicos, químicos e radiológicos.' 
  },
  { 
    id: 'NR33', 
    name: 'NR 33 - Espaço Confinado', 
    validityYears: 1, 
    workload: '16h', 
    description: 'Segurança e Saúde nos Trabalhos em Espaços Confinados. Gestão de riscos e entrada.' 
  },
  { 
    id: 'NR34', 
    name: 'NR 34 - Naval (T. Quente)', 
    validityYears: 1, 
    workload: '12h', 
    description: 'Condições e Meio Ambiente de Trabalho na Indústria da Construção e Reparação Naval (Foco em Trabalho a Quente).' 
  },
  { 
    id: 'NR35', 
    name: 'NR 35 - Altura', 
    validityYears: 2, 
    workload: '8h', 
    description: 'Trabalho em Altura. Requisitos para planejamento, organização e execução de serviços em altura.' 
  },
  {
    id: 'ROCADEIRA',
    name: 'Curso de Roçadeira',
    validityYears: 1,
    workload: '8h',
    description: 'Treinamento de segurança na operação, manutenção preventiva e uso correto de Equipamentos de Proteção Individual para roçadeiras.'
  },
  {
    id: 'MOTOSERRA',
    name: 'Curso de Motoserra',
    validityYears: 2,
    workload: '16h',
    description: 'Treinamento para operação segura de motosserra, atendendo aos requisitos de segurança e legislação florestal e ambiental.'
  },
  {
    id: 'EMPILHADEIRA',
    name: 'Curso de Empilhadeira',
    validityYears: 1,
    workload: '16h',
    description: 'Treinamento para capacitação, movimentação segura e operação de empilhadeiras conforme a NR 11.'
  },
  {
    id: 'SUPERVISOR',
    name: 'Curso de Supervisor',
    validityYears: 2,
    workload: '40h',
    description: 'Treinamento de capacitação para supervisores de segurança e operação em atividades e espaços específicos.'
  },
  {
    id: 'MANIPULADORA',
    name: 'Curso de Manipuladora',
    validityYears: 1,
    workload: '16h',
    description: 'Treinamento para capacitação, operação segura e movimentação de cargas com manipulador telescópico.'
  },
  {
    id: 'CESTOAEREO',
    name: 'Curso de Cesto Aéreo',
    validityYears: 2,
    workload: '8h',
    description: 'Treinamento de segurança para operação de plataformas de trabalho aéreo e cestos suspensos acoplados conforme as normas de segurança.'
  }
];

export const STATUS_CONFIG = {
  VALID: { label: 'Válido', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  EXPIRING: { label: 'Vencendo (60 dias)', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50' },
  EXPIRED: { label: 'Vencido', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  NOT_TRAINED: { label: 'Não Capacitado', color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-100' },
};

export const SITUATION_CONFIG: Record<EmployeeSituation, { label: string, color: string, bg: string, text: string }> = {
  ATIVO: { label: 'ATIVO', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  AFASTADO: { label: 'AFASTADO', color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  DEMITIDO: { label: 'DEMITIDO', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' }
};

export const DEPT_COLORS: string[] = [
  '#064E3B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', 
  '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#22C55E'
];

export const getDeptColor = (deptName: string) => {
  let hash = 0;
  for (let i = 0; i < deptName.length; i++) {
    hash = deptName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
};
