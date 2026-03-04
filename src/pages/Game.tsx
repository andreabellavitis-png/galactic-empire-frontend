import { useEffect, useState } from 'react';
import { useGameStore } from '../store/game.store';
import { useGameSocket } from '../hooks/useGameSocket';
import { Empires, Systems, Fleets, Planets } from '../hooks/useApi';
import { PlanetPanel } from '../components/PlanetPanel';

function useGameApi() {
  return {
    loadEmpire:  ()           => Empires.me(),
    loadSystems: ()           => Systems.list(),
    loadSystem:  (id: string) => Systems.get(id),
    moveFleet:   (id: string, dest: string) => Fleets.move(id, dest),
    colonize:    (id: string) => Planets.colonize(id),
  };
}

// ── ResourceBar ───────────────────────────────────────────────────
const RESOURCES = [
  { key: 'CREDITS',     icon: '◈', label: 'CR',  color: '#ffcc00' },
  { key: 'METALS',      icon: '⬡', label: 'MT',  color: '#88aacc' },
  { key: 'ENERGY',      icon: '⚡', label: 'EN',  color: '#ffdd44' },
  { key: 'FOOD',        icon: '❋', label: 'FD',  color: '#44dd88' },
  { key: 'RESEARCH',    icon: '◎', label: 'RS',  color: '#aa88ff' },
  { key: 'RARE_METALS', icon: '✦', label: 'RM',  color: '#ff8844' },
];

function ResourceBar({ resources, tick, connected, unread, onComms, onLogout }: {
  resources: any; tick: number; connected: boolean;
  unread: number; onComms: () => void; onLogout: () => void;
}) {
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.floor(n).toString();
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 44,
      background: 'rgba(0,4,12,0.95)',
      borderBottom: '1px solid rgba(0,229,255,0.1)',
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 4,
      fontFamily: '"Share Tech Mono", monospace', zIndex: 100,
    }}>
      {RESOURCES.map(r => (
        <div key={r.key} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3,
        }}>
          <span style={{ color: r.color, fontSize: 11 }}>{r.icon}</span>
          <span style={{ fontSize: 10, color: '#555', marginRight: 1 }}>{r.label}</span>
          <span style={{ fontSize: 11, color: '#bbb' }}>{fmt(resources?.[r.key] ?? 0)}</span>
        </div>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 10, color: '#00e5ff', opacity: 0.5, letterSpacing: 3 }}>
          TICK {tick}
        </div>
        <div style={{
          padding: '3px 9px', borderRadius: 3, fontSize: 9, letterSpacing: 1,
          color: connected ? '#00ff88' : '#ff2244',
          border: `1px solid ${connected ? 'rgba(0,255,136,0.25)' : 'rgba(255,34,68,0.25)'}`,
          background: connected ? 'rgba(0,255,136,0.06)' : 'rgba(255,34,68,0.06)',
        }}>
          {connected ? '◉ LIVE' : '◌ OFFLINE'}
        </div>
        <button onClick={onComms} style={{
          padding: '3px 9px', borderRadius: 3, fontSize: 9, letterSpacing: 1,
          color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)',
          background: 'rgba(0,229,255,0.06)', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ◈ COMMS {unread > 0 && <span style={{ color: '#ff2244' }}>({unread})</span>}
        </button>
        <button onClick={onLogout} style={{
          padding: '3px 9px', borderRadius: 3, fontSize: 9,
          color: '#444', border: '1px solid rgba(255,255,255,0.07)',
          background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          EXIT
        </button>
      </div>
    </div>
  );
}

// ── NotificationPanel ─────────────────────────────────────────────
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useGameStore();
  useEffect(() => { markAllRead(); }, []);

  const typeColor: any = {
    REBELLION: '#ff2244', WAR: '#ff2244', COMBAT: '#ff8844',
    PROPOSAL: '#00e5ff', APPROVAL: '#00ff88', GLOBAL: '#aa88ff', default: '#666',
  };

  return (
    <div style={{
      position: 'fixed', top: 44, right: 0, width: 320, bottom: 0,
      background: 'rgba(0,4,12,0.97)', borderLeft: '1px solid rgba(0,229,255,0.12)',
      zIndex: 200, overflowY: 'auto', fontFamily: '"Share Tech Mono", monospace',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#00e5ff', fontSize: 10, letterSpacing: 3 }}>COMMUNICATIONS</span>
        <span onClick={onClose} style={{ color: '#444', cursor: 'pointer', fontSize: 16 }}>✕</span>
      </div>
      {notifications.length === 0 && (
        <div style={{ padding: 32, color: '#333', fontSize: 11, textAlign: 'center' }}>
          No messages in queue.
        </div>
      )}
      {notifications.map(n => (
        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 10, color: typeColor[n.type] ?? typeColor.default, marginBottom: 4, letterSpacing: 1 }}>
            {n.type} — tick {n.tick}
          </div>
          <div style={{ fontSize: 11, color: '#ccc', marginBottom: 3 }}>{n.title}</div>
          <div style={{ fontSize: 10, color: '#555' }}>{n.description}</div>
        </div>
      ))}
    </div>
  );
}

// ── FleetPanel ────────────────────────────────────────────────────
function FleetPanel({ fleets, onMove, systems }: {
  fleets: any[]; systems: any[];
  onMove: (id: string, dest: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [destId, setDestId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const statusColor = (s: string) =>
    s === 'IDLE' ? '#00ff88' : s === 'MOVING' ? '#ffaa00' : '#ff2244';

  return (
    <div style={{
      position: 'fixed', left: 0, top: 44, width: 260, bottom: 0,
      background: 'rgba(0,4,12,0.95)', borderRight: '1px solid rgba(0,229,255,0.1)',
      zIndex: 150, fontFamily: '"Share Tech Mono", monospace', overflowY: 'auto',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
        <span style={{ color: '#00e5ff', fontSize: 10, letterSpacing: 3 }}>FLEET COMMAND</span>
      </div>

      {fleets.length === 0 && (
        <div style={{ padding: '24px 16px', color: '#333', fontSize: 11, textAlign: 'center' }}>
          No fleets available.
        </div>
      )}

      {fleets.map(fleet => (
        <div key={fleet.id}
          onClick={() => setSelected(selected === fleet.id ? null : fleet.id)}
          style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
            background: selected === fleet.id ? 'rgba(0,229,255,0.05)' : 'transparent',
            transition: 'background 0.15s',
          }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 5 }}>{fleet.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 9, color: statusColor(fleet.status),
              background: `${statusColor(fleet.status)}18`,
              padding: '2px 7px', borderRadius: 3, letterSpacing: 1,
            }}>
              {fleet.status}
            </span>
            <span style={{ fontSize: 9, color: '#555', padding: '2px 7px', background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
              {fleet.total_ships ?? '?'} ships
            </span>
          </div>

          {/* Supply bar */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: '#333' }}>Supply</span>
              <span style={{ fontSize: 9, color: '#555' }}>{Math.round(fleet.supply_level ?? 0)}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <div style={{
                width: `${fleet.supply_level ?? 0}%`, height: '100%', borderRadius: 2,
                background: (fleet.supply_level ?? 0) < 20 ? '#ff2244' : '#00e5ff',
                transition: 'width 0.5s',
              }} />
            </div>
          </div>

          {/* Progress bar se in movimento */}
          {fleet.travel_state && (
            <div>
              <div style={{ fontSize: 9, color: '#555', marginBottom: 2 }}>
                → {systems.find(s => s.id === fleet.travel_state?.dest_system)?.name ?? 'Transit'}
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{
                  width: `${(fleet.travel_state.progress ?? 0) * 100}%`, height: '100%',
                  background: '#ffaa00', borderRadius: 2, transition: 'width 1s',
                }} />
              </div>
            </div>
          )}

          {/* Move controls */}
          {selected === fleet.id && fleet.status === 'IDLE' && (
            <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
              {/* Dropdown sistemi */}
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    padding: '6px 8px', background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.2)', color: destId ? '#ccc' : '#444',
                    fontSize: 11, borderRadius: 3, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                  <span>{systems.find(s => s.id === destId)?.name ?? 'Select destination...'}</span>
                  <span style={{ color: '#555' }}>▾</span>
                </div>
                {showDropdown && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    background: '#020c18', border: '1px solid rgba(0,229,255,0.2)',
                    borderRadius: 3, zIndex: 10, maxHeight: 180, overflowY: 'auto',
                  }}>
                    {systems.map(sys => (
                      <div key={sys.id}
                        onClick={() => { setDestId(sys.id); setShowDropdown(false); }}
                        style={{
                          padding: '7px 10px', fontSize: 11,
                          color: sys.id === destId ? '#00e5ff' : '#aaa', cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                        {sys.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { if (destId) { onMove(fleet.id, destId); setDestId(''); setSelected(null); } }}
                disabled={!destId}
                style={{
                  width: '100%', padding: '7px', fontSize: 10, letterSpacing: 2,
                  border: '1px solid rgba(0,229,255,0.4)', background: 'rgba(0,229,255,0.07)',
                  color: '#00e5ff', cursor: destId ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', borderRadius: 3, opacity: destId ? 1 : 0.4,
                }}>
                MOVE FLEET
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Game ─────────────────────────────────────────────────────
export default function Game() {
  const {
    empire, systems, currentSystem, selectedPlanet, currentTick,
    unreadCount, connected,
    setEmpire, setSystems, setCurrentSystem, setSelectedPlanet, logout,
  } = useGameStore();

  useGameSocket();
  const gameApi = useGameApi();

  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'galaxy' | 'diplomacy'>('system');
  const [loadingSystem, setLoadingSystem] = useState<string | null>(null);

  useEffect(() => {
    gameApi.loadEmpire().then(setEmpire).catch(console.error);
    gameApi.loadSystems().then(setSystems).catch(console.error);
  }, []);

  useEffect(() => {
    if (empire && !currentSystem) {
      const firstSystemId = empire.planets?.[0]?.system_id;
      if (firstSystemId) loadSystem(firstSystemId);
    }
  }, [empire]);

  const loadSystem = async (id: string) => {
    setLoadingSystem(id);
    try {
      const sys = await gameApi.loadSystem(id);
      setCurrentSystem(sys);
    } catch (e) { console.error(e); }
    finally { setLoadingSystem(null); }
  };

  const handleFleetMove = async (fleetId: string, destId: string) => {
    try {
      await gameApi.moveFleet(fleetId, destId);
      gameApi.loadEmpire().then(setEmpire);
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Move failed'); }
  };

  const rightPanelOpen = selectedPlanet && !showNotifications;
  const resources = empire?.resource_pool;

  const tabBtn = (t: 'system' | 'galaxy' | 'diplomacy') => ({
    padding: '7px 18px', border: 'none', cursor: 'pointer' as const, borderRadius: 3,
    background: activeTab === t ? 'rgba(0,229,255,0.1)' : 'transparent',
    color: activeTab === t ? '#00e5ff' : '#444',
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const,
    fontFamily: '"Share Tech Mono", monospace', transition: 'all 0.15s',
  });

  return (
    <div style={{ background: '#020810', minHeight: '100vh', fontFamily: '"Share Tech Mono", monospace' }}>
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />

      <ResourceBar
        resources={resources} tick={currentTick} connected={connected}
        unread={unreadCount}
        onComms={() => { setShowNotifications(!showNotifications); setSelectedPlanet(null); }}
        onLogout={logout}
      />

      {/* Left: Fleet panel */}
      <FleetPanel
        fleets={empire?.fleets ?? []}
        systems={systems}
        onMove={handleFleetMove}
      />

      {/* Center */}
      <div style={{ marginLeft: 260, marginRight: rightPanelOpen || showNotifications ? 320 : 0, paddingTop: 44 }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 16px',
          borderBottom: '1px solid rgba(0,229,255,0.07)',
          background: 'rgba(0,4,12,0.6)',
        }}>
          {(['system', 'galaxy', 'diplomacy'] as const).map(t => (
            <button key={t} style={tabBtn(t)} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>

        {/* ── SYSTEM VIEW ── */}
        {activeTab === 'system' && (
          <div style={{ padding: 20 }}>
            {currentSystem ? (
              <>
                {/* Header sistema */}
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: 20, letterSpacing: 4, fontFamily: 'Orbitron, sans-serif' }}>
                    {currentSystem.name.toUpperCase()}
                  </h2>
                  <span style={{
                    fontSize: 9, letterSpacing: 2, padding: '2px 8px', borderRadius: 2,
                    color: currentSystem.owner_id === empire?.id ? '#00e5ff' : '#888',
                    border: `1px solid ${currentSystem.owner_id === empire?.id ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    background: currentSystem.owner_id === empire?.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                  }}>
                    {currentSystem.owner_id
                      ? currentSystem.owner_id === empire?.id ? 'YOUR TERRITORY' : 'FOREIGN SPACE'
                      : 'UNCLAIMED'}
                  </span>
                </div>

                {/* Griglia pianeti */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {(currentSystem.bodies ?? []).map((planet: any) => {
                    const isSelected = selectedPlanet?.id === planet.id;
                    const loyalty = planet.loyalty ?? 100;
                    const loyaltyColor = loyalty < 20 ? '#ff2244' : loyalty < 40 ? '#ffaa00' : '#00e5ff';

                    const PLANET_BG: any = {
                      TERRESTRIAL: '#2a6b3a', GAS_GIANT: '#8844aa', ICE: '#4488cc',
                      DESERT: '#cc7733', VOLCANIC: '#cc2211', OCEAN: '#1155cc',
                      BARREN: '#445566', DEFAULT: '#334455',
                    };
                    const dotColor = PLANET_BG[planet.type?.toUpperCase()] ?? PLANET_BG.DEFAULT;

                    return (
                      <div key={planet.id}
                        onClick={() => setSelectedPlanet(isSelected ? null : planet)}
                        style={{
                          padding: 16,
                          background: isSelected ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.025)',
                          borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${isSelected ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          transition: 'all 0.15s',
                          boxShadow: isSelected ? '0 0 20px rgba(0,229,255,0.1)' : 'none',
                        }}>
                        {/* Pianeta dot */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', marginBottom: 12,
                          background: `radial-gradient(circle at 35% 35%, ${dotColor}, ${dotColor}44)`,
                          boxShadow: isSelected ? `0 0 12px ${dotColor}66` : 'none',
                        }} />

                        <div style={{ fontSize: 12, color: isSelected ? '#fff' : '#ccc', marginBottom: 4, letterSpacing: 1 }}>
                          {planet.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#444', marginBottom: 8 }}>
                          {planet.type?.replace('_', ' ')}
                        </div>

                        {/* Status badge */}
                        <span style={{
                          fontSize: 9, letterSpacing: 1, padding: '2px 7px', borderRadius: 2,
                          color: STATUS_COLOR[planet.status] ?? '#555',
                          background: `${STATUS_COLOR[planet.status] ?? '#555'}18`,
                        }}>
                          {planet.status}
                        </span>

                        {/* Population */}
                        {(planet.population ?? 0) > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 9, color: '#444' }}>POP</span>
                              <span style={{ fontSize: 9, color: '#666' }}>{(planet.population ?? 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 9, color: '#444' }}>LOYALTY</span>
                              <span style={{ fontSize: 9, color: loyaltyColor }}>{Math.round(loyalty)}</span>
                            </div>
                            {/* Mini loyalty bar */}
                            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                              <div style={{ width: `${loyalty}%`, height: '100%', background: loyaltyColor, borderRadius: 1 }} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 80, color: '#333', fontSize: 12 }}>
                No system selected. Open the Galaxy tab to navigate.
              </div>
            )}
          </div>
        )}

        {/* ── GALAXY VIEW ── */}
        {activeTab === 'galaxy' && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 10, color: '#00e5ff', letterSpacing: 3, marginBottom: 16, opacity: 0.7 }}>
              KNOWN SYSTEMS — {systems.length} charted
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
              {systems.map(sys => (
                <div key={sys.id}
                  onClick={() => { loadSystem(sys.id); setActiveTab('system'); }}
                  style={{
                    padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 5, cursor: 'pointer',
                    border: `1px solid ${sys.owner_id === empire?.id ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: loadingSystem === sys.id ? 0.4 : 1, transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 12, color: sys.owner_id === empire?.id ? '#00e5ff' : '#aaa', marginBottom: 5, letterSpacing: 1 }}>
                    {sys.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: 1, padding: '1px 6px', borderRadius: 2,
                      color: sys.owner_id ? (sys.owner_id === empire?.id ? '#00e5ff' : '#ff8844') : '#555',
                      background: sys.owner_id ? (sys.owner_id === empire?.id ? 'rgba(0,229,255,0.1)' : 'rgba(255,136,68,0.1)') : 'rgba(255,255,255,0.04)',
                    }}>
                      {sys.owner_id ? (sys.owner_id === empire?.id ? 'YOURS' : 'FOREIGN') : 'UNCLAIMED'}
                    </span>
                    <span style={{ fontSize: 9, color: '#444', padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                      {sys.hyperlane_ids?.length ?? 0} lanes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DIPLOMACY (placeholder) ── */}
        {activeTab === 'diplomacy' && (
          <div style={{ padding: 60, textAlign: 'center', color: '#333' }}>
            <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.2 }}>⚖</div>
            <div style={{ fontSize: 12, letterSpacing: 2 }}>DIPLOMACY MODULE</div>
            <div style={{ fontSize: 10, marginTop: 8, color: '#2a2a2a' }}>Coming soon — /diplomacy endpoints ready</div>
          </div>
        )}
      </div>

      {/* Right panels */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      {selectedPlanet && !showNotifications && (
        <PlanetPanel
          planet={selectedPlanet}
          empireId={empire?.id}
          onClose={() => setSelectedPlanet(null)}
          onColonize={gameApi.colonize}
          onPlanetUpdate={(p) => {
            setSelectedPlanet(p);
            gameApi.loadEmpire().then(setEmpire);
            if (currentSystem) gameApi.loadSystem(currentSystem.id).then(setCurrentSystem);
          }}
        />
      )}
    </div>
  );
}

const STATUS_COLOR: any = {
  COLONIZED: '#00e5ff', UNINHABITED: '#333', CONTESTED: '#ffaa00', REBELLING: '#ff2244',
};
