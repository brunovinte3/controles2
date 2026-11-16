
import { TrainingStatus, TrainingRecord, Employee, EmployeeSituation } from '../types';
import { NR_COURSES } from '../constants';

export const parseFlexibleDate = (dateStr: any): Date | null => {
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

export const getDaysRemaining = (expiryDate: string | undefined, todayMidnightMs?: number): number | null => {
  if (!expiryDate) return null;
  let baseMs = todayMidnightMs;
  if (baseMs === undefined) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    baseMs = today.getTime();
  }
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - baseMs;
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

// Pré-computa as chaves normalizadas uma única vez para acelerar processamento de grandes planilhas
const PRECOMPUTED_COURSES = NR_COURSES.map(course => ({
  course,
  searchKeys: [course.id, course.name, ...(course.aliases || [])].map(normalizeKey)
}));

export const formatEmployeeData = (rawData: any[]): Employee[] => {
  if (!Array.isArray(rawData)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMidnightMs = today.getTime();

  return rawData.map((row, idx) => {
    const trainings: Record<string, TrainingRecord> = {};
    const normalizedRow: Record<string, any> = {};
    
    const rawKeys = Object.keys(row);
    for (let i = 0; i < rawKeys.length; i++) {
      const k = rawKeys[i];
      normalizedRow[normalizeKey(k)] = row[k];
    }
    const rowKeys = Object.keys(normalizedRow);

    for (let cIdx = 0; cIdx < PRECOMPUTED_COURSES.length; cIdx++) {
      const { course, searchKeys } = PRECOMPUTED_COURSES[cIdx];
      let completionValue: any = undefined;

      // 1. Busca por correspondência exata de chave normalizada
      for (let i = 0; i < searchKeys.length; i++) {
        const val = normalizedRow[searchKeys[i]];
        if (val !== undefined && val !== null && val !== '') {
          completionValue = val;
          break;
        }
      }

      // 2. Busca por contenção em chaves com tamanho seguro (evita colisão de termos curtos)
      if (completionValue === undefined) {
        for (let i = 0; i < searchKeys.length; i++) {
          const sk = searchKeys[i];
          if (sk.length >= 6) {
            const found = rowKeys.find(rk => rk === sk || rk.includes(sk));
            if (found !== undefined) {
              const val = normalizedRow[found];
              if (val !== undefined && val !== null && val !== '') {
                completionValue = val;
                break;
              }
            }
          }
        }
      }

      // Parse único por célula (elimina parsing repetido)
      const parsedDate = parseFlexibleDate(completionValue);
      let completionDate: string | undefined;
      let expiryDate: string | undefined;
      let status: TrainingStatus = 'NOT_TRAINED';

      if (parsedDate) {
        completionDate = parsedDate.toISOString().split('T')[0];
        if (course.validityYears === null) {
          status = 'VALID';
        } else {
          const expiry = new Date(parsedDate);
          expiry.setFullYear(expiry.getFullYear() + course.validityYears);
          expiryDate = expiry.toISOString().split('T')[0];
          expiry.setHours(0, 0, 0, 0);
          const daysRemaining = Math.ceil((expiry.getTime() - todayMidnightMs) / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0) status = 'EXPIRED';
          else if (daysRemaining <= 60) status = 'EXPIRING';
          else status = 'VALID';
        }
      }

      trainings[course.id] = {
        courseId: course.id,
        completionDate,
        expiryDate,
        status,
      };
    }

    const registration = String(normalizedRow['MATRICULA'] || normalizedRow['REGISTRO'] || normalizedRow['RE'] || `ID-${idx}`).trim();
    const id = row.id || registration; 

    // Mapeamento da Situação
    let situation: EmployeeSituation = 'ATIVO';
    const sitValue = String(normalizedRow['SITUACAO'] || normalizedRow['STATUS'] || '').toUpperCase().trim();
    if (sitValue === 'DEMITIDO' || sitValue === 'DEMITIDA' || sitValue === 'DESLIGADO' || sitValue === 'DESLIGADA') situation = 'DEMITIDO';
    else if (sitValue === 'AFASTADO' || sitValue === 'AFASTADA' || sitValue === 'LICENCA') situation = 'AFASTADO';
    
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
