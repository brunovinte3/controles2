
import { TrainingStatus, TrainingRecord, Employee, EmployeeSituation } from '../types';
import { NR_COURSES } from '../constants';

const parseFlexibleDate = (dateStr: any): Date | null => {
  if (!dateStr || dateStr === '-' || String(dateStr).toLowerCase() === 'n/a' || dateStr === '') return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  const str = String(dateStr).trim();
  
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const [day, month, year] = str.split('/').map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const getDaysRemaining = (expiryDate: string | undefined): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(days) ? null : days;
};

export const getExpiryDate = (completionDate: string | undefined, validityYears: number | null): string | undefined => {
  const dateObj = parseFlexibleDate(completionDate);
  if (!dateObj || validityYears === null) return undefined;
  const expiry = new Date(dateObj);
  expiry.setFullYear(expiry.getFullYear() + validityYears);
  return expiry.toISOString().split('T')[0];
};

export const calculateTrainingStatus = (completionDate: string | undefined, validityYears: number | null): TrainingStatus => {
  const dateObj = parseFlexibleDate(completionDate);
  if (!dateObj) return 'NOT_TRAINED';
  if (validityYears === null) return 'VALID';
  const expiryStr = getExpiryDate(completionDate, validityYears);
  const daysRemaining = getDaysRemaining(expiryStr);
  if (daysRemaining === null) return 'VALID';
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 60) return 'EXPIRING';
  return 'VALID';
};

const normalizeKey = (key: string) => 
  String(key || '').toUpperCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "") 
     .replace(/[-_\s.]/g, ""); 

export const formatEmployeeData = (rawData: any[]): Employee[] => {
  if (!Array.isArray(rawData)) return [];
  return rawData.map((row, idx) => {
    const trainings: Record<string, TrainingRecord> = {};
    const normalizedRow: any = {};
    
    Object.keys(row).forEach(k => {
      normalizedRow[normalizeKey(k)] = row[k];
    });

    NR_COURSES.forEach(course => {
      const courseKey = normalizeKey(course.id);
      const completionValue = normalizedRow[courseKey];
      const status = calculateTrainingStatus(completionValue, course.validityYears);
      const expiryDate = getExpiryDate(completionValue, course.validityYears);
      const parsedDate = parseFlexibleDate(completionValue);
      
      trainings[course.id] = {
        courseId: course.id,
        completionDate: parsedDate ? parsedDate.toISOString().split('T')[0] : undefined,
        expiryDate,
        status,
      };
    });

    const registration = String(normalizedRow['MATRICULA'] || normalizedRow['REGISTRO'] || normalizedRow['RE'] || `ID-${idx}`).trim();
    const id = row.id || registration; 

    // Mapeamento da Situação
    let situation: EmployeeSituation = 'ATIVO';
    const sitValue = String(normalizedRow['SITUACAO'] || normalizedRow['STATUS'] || '').toUpperCase().trim();
    if (sitValue === 'DEMITIDO' || sitValue === 'DEMITIDA' || sitValue === 'DESLIGADO' || sitValue === 'DESLIGADA') situation = 'DEMITIDO';
    else if (sitValue === 'AFASTADO' || sitValue === 'AFASTADA' || sitValue === 'LICENCA') situation = 'AFASTADO';
    // Se vazio ou qualquer outro valor não reconhecido, assume ATIVO conforme regra 2
    
    return {
      id: id,
      name: normalizedRow['NOMECOMPLETO'] || normalizedRow['NOME'] || 'Sem Nome',
      registration: registration,
      role: normalizedRow['FUNCAO'] || normalizedRow['CARGO'] || '-',
      setor: normalizedRow['SETOR'] || normalizedRow['DEPARTAMENTO'] || '-',
      company: normalizedRow['EMPRESA'] || normalizedRow['UNIDADE'] || 'Empresa Padrão',
      photoUrl: normalizedRow['FOTO'] || normalizedRow['URLFOTO'] || undefined,
      situation: situation,
      trainings,
    };
  });
};
