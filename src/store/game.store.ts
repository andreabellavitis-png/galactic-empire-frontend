// store/game.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResourcePool {
  METALS: number; RARE_METALS: number; ENERGY: number;
  FOOD: number; RESEARCH: number; HELIUM3: number;
  EXOTIC: number; CREDITS: number;
}

export interface Empire {
  id: string; name: string; color: string;
  tech_level: number; victory_points: number;
  resource_pool: ResourcePool;
  planets: Planet[]; fleets: Fleet[];
  current_tick: number;
}

export interface Planet {
  id: string; name: string; type: string; system_id: string;
  population: number; status: string; loyalty: number;
  morale?: number; stability?: number; habitability?: number;
  owner_id?: string; controller_id?: string;
  resource_flow?: any; building_ids?: string[];
}

export interface Fleet {
  id: string; name: string; empire_id: string;
  status: string; current_system_id: string;
  total_ships: number; total_firepower: number;
  total_hull: number; total_shields: number;
  morale: number; supply_level: number; experience: number;
  travel_state?: {
    dest_system: string; progress: number;
    arrival_tick: number; departure_tick: number;
  } | null;
}

export interface StarSystem {
  id: string; name: string;
  coordinates: { x: number; y: number; z: number };
  owner_id: string | null; status: string;
  hyperlane_ids: string[];
  bodies?: Planet[]; fleets?: Fleet[];
}

export interface Notification {
  id: string; type: string; title: string;
  description: string; tick: number; read: boolean;
}

interface GameStore {
  // Auth
  token:     string | null;
  empire_id: string | null;
  username:  string | null;
  setAuth:   (token: string, empire_id: string, username: string) => void;
  logout:    () => void;

  // Game state
  empire:     Empire | null;
  systems:    StarSystem[];
  currentSystem: StarSystem | null;
  selectedPlanet: Planet | null;
  currentTick: number;

  // Notifications
  notifications: Notification[];
  unreadCount:   number;

  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;

  // Actions
  setEmpire:          (e: Empire) => void;
  setSystems:         (s: StarSystem[]) => void;
  setCurrentSystem:   (s: StarSystem | null) => void;
  setSelectedPlanet:  (p: Planet | null) => void;
  setCurrentTick:     (t: number) => void;

  // Delta patch (da WebSocket tick:delta)
  applyTickDelta: (delta: any) => void;

  // Notifications
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void;
  markAllRead:     () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      token: null, empire_id: null, username: null,
      empire: null, systems: [], currentSystem: null,
      selectedPlanet: null, currentTick: 0,
      notifications: [], unreadCount: 0, connected: false,

      setAuth: (token, empire_id, username) =>
        set({ token, empire_id, username }),

      logout: () => set({
        token: null, empire_id: null, username: null,
        empire: null, systems: [], currentSystem: null,
        notifications: [],
      }),

      setConnected:       (v) => set({ connected: v }),
      setEmpire:          (e) => set({ empire: e }),
      setSystems:         (s) => set({ systems: s }),
      setCurrentSystem:   (s) => set({ currentSystem: s }),
      setSelectedPlanet:  (p) => set({ selectedPlanet: p }),
      setCurrentTick:     (t) => set({ currentTick: t }),

      applyTickDelta: (delta) => {
        const { empire, systems, currentSystem } = get();
        if (!delta) return;

        // Aggiorna tick
        if (delta.tick) set({ currentTick: delta.tick });

        // Aggiorna risorse empire
        if (delta.empireResources?.length) {
          const myResources = delta.empireResources.find(
            (r: any) => r.empire_id === get().empire_id,
          );
          if (myResources && empire) {
            set({ empire: { ...empire, resource_pool: myResources.resource_pool } });
          }
        }

        // Aggiorna flotte
        if (delta.fleets?.length && empire) {
          const updatedFleets = empire.fleets.map(f => {
            const upd = delta.fleets.find((d: any) => d.fleet_id === f.id);
            if (!upd) return f;
            return {
              ...f,
              status:    upd.status ?? f.status,
              supply_level: upd.supply ?? f.supply_level,
              morale:    upd.morale ?? f.morale,
              current_system_id: upd.system_id ?? f.current_system_id,
              travel_state: upd.progress !== undefined
                ? { ...f.travel_state, progress: upd.progress }
                : f.travel_state,
            };
          });
          set({ empire: { ...empire, fleets: updatedFleets } });
        }

        // Aggiorna pianeti
        if (delta.planets?.length && empire) {
          const updatedPlanets = empire.planets.map(p => {
            const upd = delta.planets.find((d: any) => d.planet_id === p.id);
            return upd ? { ...p, ...upd, id: p.id } : p;
          });
          set({ empire: { ...empire, planets: updatedPlanets } });

          // Aggiorna anche il currentSystem se aperto
          if (currentSystem) {
            const updBodies = (currentSystem.bodies ?? []).map(b => {
              const upd = delta.planets.find((d: any) => d.planet_id === b.id);
              return upd ? { ...b, ...upd, id: b.id } : b;
            });
            set({ currentSystem: { ...currentSystem, bodies: updBodies } });
          }
        }

        // Notifiche eventi
        if (delta.events?.length) {
          delta.events.forEach((ev: any) => {
            get().addNotification({
              type: ev.type, title: ev.title,
              description: ev.description, tick: delta.tick,
            });
          });
        }

        // Notifiche combattimento
        if (delta.combatResults?.length) {
          delta.combatResults.forEach((cr: any) => {
            const myId = get().empire_id;
            if (cr.attacker_id === myId || cr.defender_id === myId) {
              get().addNotification({
                type: 'COMBAT', title: `Combat in system`,
                description: `Outcome: ${cr.outcome} | You lost ${
                  cr.attacker_id === myId ? cr.losses_attacker : cr.losses_defender
                } ships`,
                tick: delta.tick,
              });
            }
          });
        }
      },

      addNotification: (n) => {
        const notif: Notification = {
          ...n, id: crypto.randomUUID(), read: false,
        };
        set(s => ({
          notifications: [notif, ...s.notifications].slice(0, 50),
          unreadCount: s.unreadCount + 1,
        }));
      },

      markAllRead: () =>
        set(s => ({
          notifications: s.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        })),
    }),
    {
      name:    'galactic-empire-store',
      partialize: (s) => ({ token: s.token, empire_id: s.empire_id, username: s.username }),
    },
  ),
);
