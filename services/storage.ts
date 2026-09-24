
import { Employee, AdminProfile, CompanyProfile } from '../types';
import { supabase } from './supabase';
import { formatEmployeeData } from '../utils/calculations';

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

  async getEmployees(): Promise<Employee[]> {
    const cached = this.getCachedEmployees();

    // Tentar carregar da planilha Google com timeout estrito de 6 segundos
    try {
      const sheetsData = await this.fetchDirectlyFromSheets();
      if (sheetsData.length > 0) {
        this.setCachedEmployees(sheetsData);
        // Salva em segundo plano no Supabase sem bloquear a UI
        this.saveEmployees(sheetsData).catch(() => {});
        return sheetsData;
      }
    } catch (e) {
      console.warn("Busca do Google Sheets falhou ou atingiu timeout");
    }

    // Tentar carregar do Supabase com timeout de 4 segundos
    try {
      const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout Supabase")), 4000)
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

    // Se a rede falhar mas tínhamos cache local, retorna o cache para não deixar o usuário no vácuo
    if (cached.length > 0) {
      return cached;
    }

    return [];
  },

  async fetchDirectlyFromSheets(): Promise<Employee[]> {
    const url = this.getSheetsUrl();
    if (!url) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos max

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
        const formatted = formatEmployeeData(data).map(normalizeEmployee);
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
      await supabase.from('employees').upsert(normalized, { onConflict: 'id' });
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

  async syncWithSheets(): Promise<boolean> {
    const data = await this.fetchDirectlyFromSheets();
    if (data.length > 0) {
      await this.saveEmployees(data);
      this.setLastSyncTime();
      return true;
    }
    return false;
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

