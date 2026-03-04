// hooks/useApi.ts — Axios wrapper con auth automatica
import axios from 'axios';
import { useGameStore } from '../store/game.store';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: BASE });

// Intercettore: aggiunge JWT automaticamente
api.interceptors.request.use(config => {
  const token = useGameStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercettore: logout su 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) useGameStore.getState().logout();
    return Promise.reject(err);
  },
);

// ── API calls ─────────────────────────────────────────────

export const Auth = {
  register: (d: { username: string; email: string; password: string; empire_name: string; empire_color?: string }) =>
    api.post('/auth/register', d).then(r => r.data),
  login: (d: { username: string; password: string }) =>
    api.post('/auth/login', d).then(r => r.data),
};

export const Empires = {
  me:   () => api.get('/empires/me').then(r => r.data),
  list: () => api.get('/empires').then(r => r.data),
  get:  (id: string) => api.get(`/empires/${id}`).then(r => r.data),
};

export const Systems = {
  list:    () => api.get('/systems').then(r => r.data),
  get:     (id: string) => api.get(`/systems/${id}`).then(r => r.data),
  planets: (id: string) => api.get(`/systems/${id}/planets`).then(r => r.data),
};

export const Fleets = {
  list:   () => api.get('/fleets').then(r => r.data),
  get:    (id: string) => api.get(`/fleets/${id}`).then(r => r.data),
  move:   (id: string, dest: string) => api.post(`/fleets/${id}/move`, { destination_system_id: dest }).then(r => r.data),
  create: (d: { name: string; system_id: string; ships?: number }) => api.post('/fleets/create', d).then(r => r.data),
};

export const Planets = {
  get:      (id: string) => api.get(`/planets/${id}`).then(r => r.data),
  colonize: (id: string) => api.post(`/planets/${id}/colonize`).then(r => r.data),
};

export const Diplomacy = {
  relations:   () => api.get('/diplomacy/relations').then(r => r.data),
  proposals:   () => api.get('/diplomacy/proposals').then(r => r.data),
  sendProposal: (d: any) => api.post('/diplomacy/proposals', d).then(r => r.data),
  respond:     (id: string, d: { action: 'ACCEPT' | 'REJECT'; response_message?: string }) =>
    api.post(`/diplomacy/proposals/${id}/respond`, d).then(r => r.data),
  declareWar:  (d: any) => api.post('/diplomacy/wars', d).then(r => r.data),
  treaties:    () => api.get('/diplomacy/treaties').then(r => r.data),
  wars:        () => api.get('/diplomacy/wars').then(r => r.data),
};
