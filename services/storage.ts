
import { Employee, AdminProfile, CompanyProfile } from '../types';
import { supabase } from './supabase';
import { formatEmployeeData, calculateTrainingStatus, getExpiryDate, parseFlexibleDate } from '../utils/calculations';

const DEFAULT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyazZ7cte9PaYLtBnlPNm62UvRjzRttAQsWxsb0vaQI6J_jZ37lgwJ4lxsFp5Do8M8c/exec';
const LOCAL_STORAGE_CACHE_KEY = 'sst_employees_cache_v2';

const DEFAULT_ADMIN: AdminProfile = {
  username: 'Bruno',
  password: '#Bruno91218175',
  email: 'brunosilva1232014@gmail.com',
  icon: '👨‍💼'
};

const DEFAULT_COMPANY: CompanyProfile = {
  name: 'ControlSST',
  cnpj: '00.000.000/0001-00',
  logoUrl: '🛡️',
  footerText: 'Relatório Gerencial de Conformidade Normativa'
};

const normalizeEmployee = (emp: any): Employee => {
  const trainings: Record<string, any> = (emp?.trainings && typeof emp.trainings === 'object') 
    ? { ...emp.trainings } 
    : {};

  // Mapeamento e retrocompatibilidade para NR23QC (Queima Controlada)
  if (!trainings['NR23QC']) {
    const qcVal = trainings['NR23 QUEIMA CONTROLADA'] || trainings['NR23_QC'] || trainings['QUEIMA CONTROLADA'] || trainings['NR 23 - QUEIMA CONTROLADA'];
    if (qcVal) trainings['NR23QC'] = { ...qcVal, courseId: 'NR23QC' };
  }

  // Mapeamento e retrocompatibilidade para NR23MEC (Mecanizada)
  if (!trainings['NR23MEC']) {
    const mecVal = trainings['NR23 MECANIZADA'] || trainings['NR23_MEC'] || trainings['MECANIZADA'] || trainings['NR 23 - MECANIZADA'];
    if (mecVal) trainings['NR23MEC'] = { ...mecVal, courseId: 'NR23MEC' };
  }

  // Mapeamento e retrocompatibilidade para GUINDAUTO (Caminhão Guindauto)
  if (!trainings['GUINDAUTO']) {
    const guindVal =
      trainings['CAMINHAO GUINDAUTO'] ||
      trainings['CAMINHÃO GUINDAUTO'] ||
      trainings['CAMINHAOGUINDAUTO'] ||
      trainings['CAMINHAO_GUINDAUTO'] ||
      trainings['CURSO DE CAMINHAO GUINDAUTO'] ||
      trainings['CURSO DE CAMINHÃO GUINDAUTO'];

    if (guindVal && typeof guindVal === 'object') {
      trainings['GUINDAUTO'] = { ...guindVal, courseId: 'GUINDAUTO' };
    } else {
      const rawColVal =
        guindVal ??
        emp?.['CAMINHAO GUINDAUTO'] ??
        emp?.['CAMINHÃO GUINDAUTO'] ??
        emp?.['caminhao_guindauto'] ??
        emp?.['CAMINHAO_GUINDAUTO'] ??
        emp?.['CAMINHAOGUINDAUTO'] ??
        emp?.['GUINDAUTO'] ??
        emp?.['guindauto'];

      if (rawColVal !== undefined && rawColVal !== null && rawColVal !== '') {
        if (typeof rawColVal === 'object' && rawColVal.status) {
          trainings['GUINDAUTO'] = { ...rawColVal, courseId: 'GUINDAUTO' };
        } else {
          const completionStr = String(rawColVal);
          const parsedDate = parseFlexibleDate(completionStr);
          trainings['GUINDAUTO'] = {
            courseId: 'GUINDAUTO',
            completionDate: parsedDate ? parsedDate.toISOString().split('T')[0] : undefined,
            expiryDate: getExpiryDate(completionStr, 1),
            status: calculateTrainingStatus(completionStr, 1)
          };
        }
      }
    }
  }

  return {
    id: String(emp?.id || `emp-${Math.random().toString(36).substring(2, 9)}`),
    name: String(emp?.name || 'Sem Nome'),
    registration: String(emp?.registration || '-'),
    role: String(emp?.role || '-'),
    setor: String(emp?.setor || 'Geral'),
    company: String(emp?.company || 'Empresa Padrão'),
    situation: emp?.situation || 'ATIVO',
    photoUrl: emp?.photoUrl || undefined,
    trainings
  };
};

export const StorageService = {
  getCachedEmployees(): Employee[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeEmployee);
        }
      }
    } catch (e) {
      console.warn("Falha ao ler cache local de colaboradores", e);
    }
    return [];
  },

  setCachedEmployees(data: Employee[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Falha ao salvar cache local de colaboradores", e);
    }
  },

  async getAppSettings(): Promise<{ company: CompanyProfile, admin: AdminProfile }> {
    try {
      // Timeout de 3s para não travar a inicialização
      const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout settings")), 3000)
      );

      const fetchPromise = supabase.from('app_settings').select('*');
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
      const company = data?.find((i: any) => i.key === 'company_profile')?.value || DEFAULT_COMPANY;
      const admin = data?.find((i: any) => i.key === 'admin_profile')?.value || DEFAULT_ADMIN;
      return { company, admin };
    } catch (e) {
      return { company: DEFAULT_COMPANY, admin: DEFAULT_ADMIN };
    }
  },

  async updateAppSetting(key: 'company_profile' | 'admin_profile', value: any) {
    try {
      await supabase.from('app_settings').upsert({ key, value });
    } catch (e) {
      console.warn("Não foi possível salvar configuração no Supabase.");
    }
  },

  async fetchFromSupabase(timeoutMs = 3500): Promise<Employee[]> {
    try {
      const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout Supabase")), timeoutMs)
      );

      const queryPromise = supabase.from('employees').select('*').order('name');
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeEmployee);
        this.setCachedEmployees(normalized);
        return normalized;
      }
    } catch (e) {
      console.warn("Supabase falhou ou atingiu timeout");
    }
    return [];
  },

  async getEmployees(onBackgroundUpdate?: (data: Employee[]) => void): Promise<Employee[]> {
    const cached = this.getCachedEmployees();

    // Executa Supabase e Sheets em paralelo para não bloquear esperando 6s do Sheets antes do banco
    const supaPromise = this.fetchFromSupabase(3500);
    const sheetsPromise = this.fetchDirectlyFromSheets(6000);

    // Tenta responder com o que chegar primeiro com dados válidos (Supabase geralmente <300ms)
    const fastSupa = await supaPromise;
    if (fastSupa.length > 0) {
      // Atualiza em segundo plano caso o Sheets retorne dados atualizados
      sheetsPromise.then((sheetsData) => {
        if (sheetsData.length > 0) {
          this.setCachedEmployees(sheetsData);
          this.saveEmployees(sheetsData).catch(() => {});
          if (onBackgroundUpdate) onBackgroundUpdate(sheetsData);
        }
      }).catch(() => {});
      return fastSupa;
    }

    const sheetsData = await sheetsPromise;
    if (sheetsData.length > 0) {
      this.setCachedEmployees(sheetsData);
      this.saveEmployees(sheetsData).catch(() => {});
      return sheetsData;
    }

    if (cached.length > 0) {
      return cached;
    }

    return [];
  },

  async fetchDirectlyFromSheets(timeoutMs = 6000): Promise<Employee[]> {
    const url = this.getSheetsUrl();
    if (!url) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { 
        method: 'GET', 
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) return [];
      const text = await response.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        const formatted = formatEmployeeData(data);
        if (formatted.length > 0) {
           this.setLastSyncTime();
        }
        return formatted;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Erro ou timeout no fetch do Sheets");
    }
    return [];
  },

  async saveEmployees(employees: Employee[]): Promise<void> {
    if (!employees.length) return;
    const normalized = employees.map(normalizeEmployee);
    this.setCachedEmployees(normalized);
    try {
      // Upsert em lotes paralelos para evitar gargalos em planilhas grandes
      const CHUNK_SIZE = 150;
      const chunks: Employee[][] = [];
      for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
        chunks.push(normalized.slice(i, i + CHUNK_SIZE));
      }
      await Promise.all(
        chunks.map(chunk => supabase.from('employees').upsert(chunk, { onConflict: 'id' }))
      );
    } catch (err) {
      console.warn("Erro ao sincronizar com Supabase em segundo plano");
    }
  },

  async updateEmployee(employee: Employee): Promise<void> {
    const normalized = normalizeEmployee(employee);
    // Atualiza cache local imediatamente
    const current = this.getCachedEmployees();
    const idx = current.findIndex(e => e.id === normalized.id);
    let updated: Employee[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = normalized;
    } else {
      updated = [normalized, ...current];
    }
    this.setCachedEmployees(updated);

    try {
      await supabase.from('employees').upsert(normalized);
    } catch (e) {
      console.warn("Salvo apenas no cache local.");
    }
  },

  async forceSync(): Promise<{ success: boolean; employees: Employee[]; source: 'sheets+supabase' | 'supabase' | 'cache'; durationMs: number }> {
    const startTime = performance.now();

    // Dispara Google Sheets e Supabase simultaneamente (elimina espera sequencial)
    const [sheetsData, supaData] = await Promise.all([
      this.fetchDirectlyFromSheets(7500),
      this.fetchFromSupabase(3500)
    ]);

    if (sheetsData.length > 0) {
      this.setCachedEmployees(sheetsData);
      this.setLastSyncTime();

      // Sincroniza banco Supabase em paralelo com limite de espera de 2.5s para manter resposta rápida
      await Promise.race([
        this.saveEmployees(sheetsData),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);

      return {
        success: true,
        employees: sheetsData,
        source: 'sheets+supabase',
        durationMs: Math.round(performance.now() - startTime)
      };
    }

    if (supaData.length > 0) {
      this.setCachedEmployees(supaData);
      this.setLastSyncTime();
      return {
        success: true,
        employees: supaData,
        source: 'supabase',
        durationMs: Math.round(performance.now() - startTime)
      };
    }

    const cached = this.getCachedEmployees();
    return {
      success: cached.length > 0,
      employees: cached,
      source: 'cache',
      durationMs: Math.round(performance.now() - startTime)
    };
  },

  async syncWithSheets(): Promise<boolean> {
    const result = await this.forceSync();
    return result.success;
  },

  getSheetsUrl(): string {
    return localStorage.getItem('google_sheets_url') || DEFAULT_SHEETS_URL;
  },

  saveSheetsUrl(url: string): void {
    localStorage.setItem('google_sheets_url', url.trim());
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem('last_sync_timestamp');
  },

  setLastSyncTime(): void {
    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    localStorage.setItem('last_sync_timestamp', now);
  },

  getAdminProfile(): AdminProfile { return DEFAULT_ADMIN; },
  getCompanyProfile(): CompanyProfile { return DEFAULT_COMPANY; },

  async updateAdminProfile(admin: AdminProfile) {
    await this.updateAppSetting('admin_profile', admin);
  }
};

