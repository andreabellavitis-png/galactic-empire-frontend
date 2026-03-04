// pages/Game.tsx — Main game page: HUD + 3D system view
import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/game.store';
import { useGameSocket } from '../hooks/useGameSocket';
import { Empires, Systems, Fleets, Planets } from '../hooks/useApi';

// ── Sub-components ────────────────────────────────────────────

function ResourceBar({ resources, tick }: { resources: any; tick: number }) {
  const items = [
    { key: 'CREDITS',     icon: '◈', label: 'CR',  color: '#ffaa00' },
    { key: 'METALS',      icon: '⬡', label: 'MT',  color: '#88aacc' },
    { key: 'ENERGY',      icon: '⚡', label: 'EN',  color: '#ffdd44' },
    { key: 'FOOD',        icon: '❋', label: 'FD',  color: '#44cc88' },
    { key: 'RESEARCH',    icon: '◎', label: 'RS',  color: '#aa88ff' },
    { key: 'RARE_METALS', icon: '✦', label: 'RM',  color: '#ff8844' },
  ];
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : Math.floor(n).toString();

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 44,
      background: 'rgba(0,5,15,0.92)', borderBottom: '1px solid rgba(0,229,255,0.15)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 4,
      fontFamily: '"Share Tech Mono", monospace', zIndex: 100,
    }}>
      {items.map(item => (
        <div key={item.key} style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
          background: 'rgba(255,255,255,0.04)', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ color: item.color, fontSize: 12 }}>{item.icon}</span>
          <span style={{ fontSize: 11, color: '#888', marginRight: 2 }}>{item.label}</span>
          <span style={{ fontSize: 12, color: '#ccc' }}>{fmt(resources?.[item.key] ?? 0)}</span>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 11, color: '#00e5ff', opacity: 0.7, letterSpacing: 2 }}>
          TICK {tick}
        </div>
      </div>
    </div>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useGameStore();
  useEffect(() => { markAllRead(); }, []);

  const typeColor: any = {
    REBELLION: '#ff2244', WAR: '#ff2244', COMBAT: '#ff8844',
    PROPOSAL: '#00e5ff', APPROVAL: '#00ff88', GLOBAL: '#aa88ff',
    default: '#888',
  };

  return (
    <div style={{
      position: 'fixed', top: 44, right: 0, width: 340, bottom: 0,
      background: 'rgba(0,5,15,0.96)', borderLeft: '1px solid rgba(0,229,255,0.15)',
      zIndex: 200, overflowY: 'auto', fontFamily: '"Share Tech Mono", monospace',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#00e5ff', fontSize: 11, letterSpacing: 2 }}>COMMUNICATIONS</span>
        <span onClick={onClose} style={{ color: '#666', cursor: 'pointer', fontSize: 14 }}>✕</span>
      </div>
      {notifications.length === 0 && (
        <div style={{ padding: 20, color: '#444', fontSize: 12, textAlign: 'center' }}>No messages</div>
      )}
      {notifications.map(n => (
        <div key={n.id} style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: 11, color: typeColor[n.type] ?? typeColor.default, marginBottom: 4, letterSpacing: 1 }}>
            {n.type} — tick {n.tick}
          </div>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 3 }}>{n.title}</div>
          <div style={{ fontSize: 11, color: '#666' }}>{n.description}</div>
        </div>
      ))}
    </div>
  );
}

function PlanetPanel({ planet, onClose, onColonize }: any) {
  if (!planet) return null;
  const statusColor: any = { STABLE:'#00ff88', UNSTABLE:'#ffaa00', REBELLION:'#ff2244', OCCUPIED:'#ff8844', UNINHABITED:'#555' };
  const bar = (v: number, color: string) => (
    <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
    </div>
  );

  return (
    <div style={{
      position: 'fixed', right: 0, top: 44, width: 280, bottom: 0,
      background: 'rgba(0,5,15,0.96)', borderLeft: '1px solid rgba(0,229,255,0.15)',
      zIndex: 150, fontFamily: '"Share Tech Mono", monospace', overflowY: 'auto',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#00e5ff', fontSize: 11, letterSpacing: 2 }}>{planet.name.toUpperCase()}</span>
        <span onClick={onClose} style={{ color: '#666', cursor: 'pointer' }}>✕</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: '#555' }}>TYPE </span>
          <span style={{ fontSize: 11, color: '#aaa' }}>{planet.type?.toUpperCase()}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: '#555' }}>STATUS </span>
          <span style={{ fontSize: 11, color: statusColor[planet.status] ?? '#888' }}>{planet.status}</span>
        </div>
        {planet.status !== 'UNINHABITED' && <>
          <Stat label="POPULATION" value={planet.population?.toLocaleString() ?? '—'} />
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>LOYALTY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {bar(planet.loyalty ?? 0, '#00e5ff')}
              <span style={{ fontSize: 11, color: '#aaa', minWidth: 28 }}>{Math.round(planet.loyalty ?? 0)}</span>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>MORALE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {bar(planet.morale ?? 0, '#00ff88')}
              <span style={{ fontSize: 11, color: '#aaa', minWidth: 28 }}>{Math.round(planet.morale ?? 0)}</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 16, marginBottom: 8 }}>PRODUCTION / TICK</div>
          {planet.resource_flow?.production && Object.entries(planet.resource_flow.production)
            .filter(([_, v]) => (v as number) > 0)
            .map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#666' }}>{k}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>+{v as number}</span>
              </div>
            ))}
        </>}
        {planet.status === 'UNINHABITED' && (
          <>
            <Stat label="HABITABILITY" value={`${Math.round(planet.habitability ?? 0)}%`} />
            <button onClick={() => onColonize(planet.id)} style={{
              marginTop: 16, width: '100%', padding: '9px', border: '1px solid #00ff88',
              background: 'rgba(0,255,136,0.08)', color: '#00ff88', cursor: 'pointer',
              fontSize: 11, letterSpacing: 2, fontFamily: 'inherit', borderRadius: 4,
            }}>
              COLONIZE
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 11, color: '#aaa' }}>{value}</span>
    </div>
  );
}

function FleetPanel({ fleets, onMove }: { fleets: any[]; onMove: (id: string, dest: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [destInput, setDestInput] = useState('');

  return (
    <div style={{
      position: 'fixed', left: 0, top: 44, width: 260, bottom: 0,
      background: 'rgba(0,5,15,0.92)', borderRight: '1px solid rgba(0,229,255,0.15)',
      zIndex: 150, fontFamily: '"Share Tech Mono", monospace', overflowY: 'auto',
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
        <span style={{ color: '#00e5ff', fontSize: 11, letterSpacing: 2 }}>FLEET COMMAND</span>
      </div>
      {fleets.map(fleet => (
        <div key={fleet.id} onClick={() => setSelected(selected === fleet.id ? null : fleet.id)}
          style={{
            padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
            background: selected === fleet.id ? 'rgba(0,229,255,0.06)' : 'transparent',
          }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{fleet.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag label={fleet.status} color={fleet.status === 'IDLE' ? '#00ff88' : fleet.status === 'MOVING' ? '#ffaa00' : '#ff2244'} />
            <Tag label={`${fleet.total_ships} ships`} color="#888" />
          </div>
          {fleet.travel_state && (
            <div style={{ marginTop: 6, height: 3, background: '#111', borderRadius: 2 }}>
              <div style={{ width: `${(fleet.travel_state.progress ?? 0) * 100}%`, height: '100%', background: '#ffaa00', borderRadius: 2, transition: 'width 1s' }} />
            </div>
          )}
          {selected === fleet.id && fleet.status === 'IDLE' && (
            <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
              <input
                value={destInput} onChange={e => setDestInput(e.target.value)}
                placeholder="Destination system ID"
                style={{
                  width: '100%', padding: '6px 8px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,229,255,0.2)', color: '#ccc', fontSize: 11,
                  fontFamily: 'inherit', borderRadius: 3, marginBottom: 6, boxSizing: 'border-box',
                }}
              />
              <button onClick={() => { onMove(fleet.id, destInput); setDestInput(''); }}
                style={{
                  width: '100%', padding: '6px', border: '1px solid #00e5ff',
                  background: 'rgba(0,229,255,0.08)', color: '#00e5ff', cursor: 'pointer',
                  fontSize: 10, letterSpacing: 2, fontFamily: 'inherit', borderRadius: 3,
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

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, color, background: `${color}22`, padding: '2px 6px', borderRadius: 3, letterSpacing: 1 }}>
      {label}
    </span>
  );
}

// ── Main Game Component ────────────────────────────────────────

export default function Game() {
  const { empire, systems, currentSystem, selectedPlanet, currentTick, notifications, unreadCount,
    setEmpire, setSystems, setCurrentSystem, setSelectedPlanet, logout } = useGameStore();
  const { sendEventChoice, setView } = useGameSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'galaxy' | 'diplomacy'>('system');

  // Carica dati iniziali
  useEffect(() => {
    Empires.me().then(setEmpire).catch(console.error);
    Systems.list().then(setSystems).catch(console.error);
  }, []);

  // Carica il sistema home al primo render
  useEffect(() => {
    if (empire?.planets?.[0]?.system_id && !currentSystem) {
      loadSystem(empire.planets[0].system_id);
    }
  }, [empire]);

  const loadSystem = async (id: string) => {
    setLoadingSystem(id);
    try {
      const sys = await Systems.get(id);
      setCurrentSystem(sys);
      setView('system', id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSystem(null);
    }
  };

  const handleFleetMove = async (fleetId: string, destId: string) => {
    if (!destId.trim()) return;
    try {
      await Fleets.move(fleetId, destId);
      if (empire) {
        const updatedFleets = await Fleets.list();
        setEmpire({ ...empire, fleets: updatedFleets });
      }
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Move failed');
    }
  };

  const handleColonize = async (planetId: string) => {
    try {
      const updated = await Planets.colonize(planetId);
      setSelectedPlanet(updated);
      // Ricarica empire per aggiornare lista pianeti
      Empires.me().then(setEmpire);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Colonization failed');
    }
  };

  const resources = empire?.resource_pool;

  return (
    <div style={{ background: '#020810', minHeight: '100vh', fontFamily: '"Share Tech Mono", monospace' }}>
      {/* Top resource bar */}
      <ResourceBar resources={resources} tick={currentTick} />

      {/* Connection indicator + notifications */}
      <div style={{ position: 'fixed', top: 8, right: 16, display: 'flex', gap: 8, zIndex: 101 }}>
        <div style={{
          padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 4, fontSize: 10,
          color: useGameStore.getState().connected ? '#00ff88' : '#ff2244',
          border: `1px solid ${useGameStore.getState().connected ? 'rgba(0,255,136,0.3)' : 'rgba(255,34,68,0.3)'}`,
        }}>
          {useGameStore.getState().connected ? '◉ LIVE' : '◌ OFFLINE'}
        </div>
        <div onClick={() => setShowNotifications(!showNotifications)} style={{
          padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 4,
          fontSize: 10, color: '#00e5ff', cursor: 'pointer',
          border: '1px solid rgba(0,229,255,0.2)', position: 'relative',
        }}>
          ◈ COMMS {unreadCount > 0 && <span style={{ color: '#ff2244', marginLeft: 4 }}>({unreadCount})</span>}
        </div>
        <div onClick={logout} style={{
          padding: '4px 10px', background: 'rgba(0,0,0,0.5)', borderRadius: 4,
          fontSize: 10, color: '#555', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          LOGOUT
        </div>
      </div>

      {/* Left: Fleet panel */}
      <FleetPanel fleets={empire?.fleets ?? []} onMove={handleFleetMove} />

      {/* Center: Main content */}
      <div style={{ marginLeft: 260, marginRight: selectedPlanet ? 280 : 0, paddingTop: 44 }}>
        {/* Nav tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 16px',
          borderBottom: '1px solid rgba(0,229,255,0.08)', background: 'rgba(0,5,15,0.5)',
        }}>
          {(['system', 'galaxy', 'diplomacy'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 16px', border: 'none', cursor: 'pointer', borderRadius: 3,
              background: activeTab === tab ? 'rgba(0,229,255,0.12)' : 'transparent',
              color: activeTab === tab ? '#00e5ff' : '#444',
              fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'inherit',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* SYSTEM VIEW */}
        {activeTab === 'system' && (
          <div style={{ padding: 16 }}>
            {currentSystem ? (
              <>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: 18, letterSpacing: 3, fontFamily: 'Orbitron, sans-serif' }}>
                    {currentSystem.name.toUpperCase()}
                  </h2>
                  {currentSystem.owner_id && (
                    <span style={{ fontSize: 10, color: currentSystem.owner_id === empire?.id ? '#00e5ff' : '#ff8844', letterSpacing: 2 }}>
                      {currentSystem.owner_id === empire?.id ? 'YOUR TERRITORY' : 'FOREIGN SPACE'}
                    </span>
                  )}
                </div>

                {/* Planet grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {(currentSystem.bodies ?? []).map(planet => {
                    const statusColor: any = { STABLE:'#00ff88', UNSTABLE:'#ffaa00', REBELLION:'#ff2244', OCCUPIED:'#ff8844', UNINHABITED:'#333' };
                    return (
                      <div key={planet.id} onClick={() => setSelectedPlanet(selectedPlanet?.id === planet.id ? null : planet)}
                        style={{
                          padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${selectedPlanet?.id === planet.id ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          transition: 'all 0.15s',
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: statusColor[planet.status] ?? '#222', marginBottom: 10, opacity: 0.7 }} />
                        <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{planet.name}</div>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>{planet.type}</div>
                        <div style={{ fontSize: 10, color: statusColor[planet.status] ?? '#555' }}>{planet.status}</div>
                        {planet.population > 0 && (
                          <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
                            Pop: {planet.population?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#444', fontSize: 12 }}>
                No system selected. Choose a system from the galaxy map.
              </div>
            )}
          </div>
        )}

        {/* GALAXY VIEW */}
        {activeTab === 'galaxy' && (
          <div style={{ padding: 16 }}>
            <h3 style={{ color: '#00e5ff', fontSize: 12, letterSpacing: 3, marginBottom: 16 }}>KNOWN SYSTEMS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {systems.map(sys => (
                <div key={sys.id} onClick={() => loadSystem(sys.id)} style={{
                  padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 6,
                  cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)',
                  opacity: loadingSystem === sys.id ? 0.5 : 1, transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 12, color: sys.owner_id === empire?.id ? '#00e5ff' : '#aaa', marginBottom: 4 }}>
                    {sys.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#555' }}>
                    {sys.owner_id ? (sys.owner_id === empire?.id ? 'YOURS' : 'FOREIGN') : 'UNCLAIMED'}
                    {' · '}{sys.hyperlane_ids?.length ?? 0} lanes
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIPLOMACY VIEW (placeholder) */}
        {activeTab === 'diplomacy' && (
          <div style={{ padding: 32, textAlign: 'center', color: '#444', fontSize: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>⚖</div>
            Diplomacy interface — connect <code>/diplomacy</code> endpoints<br />
            <span style={{ fontSize: 10, marginTop: 8, display: 'block', color: '#333' }}>
              Use the REST API at /diplomacy/proposals, /diplomacy/wars
            </span>
          </div>
        )}
      </div>

      {/* Right panels */}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      {selectedPlanet && !showNotifications && (
        <PlanetPanel
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          onColonize={handleColonize}
        />
      )}
    </div>
  );
}
