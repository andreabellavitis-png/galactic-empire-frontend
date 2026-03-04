// components/PlanetPanel.tsx
// Pannello gestione pianeta completo — stile Sci-Fi Dark
import { useState, useEffect } from 'react';


// ── Tipi ──────────────────────────────────────────────────────────
interface Planet {
  id: string; name: string; type: string; status: string;
  population?: number; max_population?: number;
  loyalty?: number; morale?: number; habitability?: number;
  owner_id?: string; controller_id?: string;
  natural_resources?: Record<string, number>;
  resource_flow?: { production?: Record<string, number>; consumption?: Record<string, number> };
  buildings?: any[];
  system_id?: string;
}

// ── Costanti visive ───────────────────────────────────────────────
const RESOURCE_META: Record<string, { icon: string; color: string; label: string }> = {
  FOOD:           { icon: '❋', color: '#44dd88', label: 'Food' },
  WATER:          { icon: '◈', color: '#44aaff', label: 'Water' },
  METALS:         { icon: '⬡', color: '#88aacc', label: 'Metals' },
  RARE_METALS:    { icon: '✦', color: '#ff8844', label: 'Rare Metals' },
  ENERGY:         { icon: '⚡', color: '#ffdd44', label: 'Energy' },
  GAS:            { icon: '☁', color: '#99ddff', label: 'Gas' },
  BIOMASS:        { icon: '❀', color: '#88ff44', label: 'Biomass' },
  GOODS:          { icon: '▣', color: '#ddaaff', label: 'Goods' },
  INDUSTRIAL_GOODS:{ icon: '⚙', color: '#ffaa66', label: 'Ind. Goods' },
  CREDITS:        { icon: '◈', color: '#ffcc00', label: 'Credits' },
  RESEARCH:       { icon: '◎', color: '#aa88ff', label: 'Research' },
};

const STATUS_META: Record<string, { color: string; glow: string; label: string }> = {
  COLONIZED:   { color: '#00e5ff', glow: '0 0 8px rgba(0,229,255,0.4)', label: 'COLONIZED' },
  UNINHABITED: { color: '#444',    glow: 'none',                          label: 'UNINHABITED' },
  CONTESTED:   { color: '#ffaa00', glow: '0 0 8px rgba(255,170,0,0.4)',   label: 'CONTESTED' },
  REBELLING:   { color: '#ff2244', glow: '0 0 8px rgba(255,34,68,0.4)',   label: 'REBELLING' },
};

const PLANET_COLORS: Record<string, string> = {
  TERRESTRIAL: 'radial-gradient(circle at 35% 35%, #2a6b3a, #0d2e18)',
  GAS_GIANT:   'radial-gradient(circle at 35% 35%, #8844aa, #2d1040)',
  ICE:         'radial-gradient(circle at 35% 35%, #88ccff, #1a3a5c)',
  DESERT:      'radial-gradient(circle at 35% 35%, #cc7733, #4a2210)',
  VOLCANIC:    'radial-gradient(circle at 35% 35%, #cc2211, #3a0a00)',
  OCEAN:       'radial-gradient(circle at 35% 35%, #1155cc, #051a44)',
  BARREN:      'radial-gradient(circle at 35% 35%, #556677, #1a2030)',
  DEFAULT:     'radial-gradient(circle at 35% 35%, #334455, #111820)',
};

// ── Componenti helper ─────────────────────────────────────────────
function StatBar({ value, max = 100, color, showValue = true }: {
  value: number; max?: number; color: string; showValue?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 3,
          background: color,
          boxShadow: `0 0 6px ${color}88`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      {showValue && <span style={{ fontSize: 11, color: '#aaa', minWidth: 28, textAlign: 'right' }}>{Math.round(value)}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 9, color: '#00e5ff', letterSpacing: 3, marginBottom: 10,
      paddingBottom: 6, borderBottom: '1px solid rgba(0,229,255,0.1)',
      opacity: 0.7,
    }}>
      {children}
    </div>
  );
}

function ResourceRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ color, fontSize: 12, width: 16, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#666', flex: 1 }}>{label}</span>
      <span style={{
        fontSize: 11, color: value > 0 ? '#00ff88' : value < 0 ? '#ff4466' : '#444',
        minWidth: 40, textAlign: 'right',
      }}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </span>
    </div>
  );
}

// ── Panel Tab types ───────────────────────────────────────────────
type Tab = 'overview' | 'production' | 'buildings' | 'actions';

// ── Componente principale ─────────────────────────────────────────
export function PlanetPanel({ planet, onClose, empireId, onPlanetUpdate, onColonize }: {
  planet: Planet;
  onClose: () => void;
  empireId?: string;
  onPlanetUpdate?: (p: Planet) => void;
  onColonize?: (planetId: string) => Promise<any>;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [colonizing, setColonizing] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const status   = STATUS_META[planet.status] ?? STATUS_META.UNINHABITED;
  const bgGrad   = PLANET_COLORS[planet.type?.toUpperCase()] ?? PLANET_COLORS.DEFAULT;
  const isOwned  = planet.owner_id === empireId;
  const isUninhabited = planet.status === 'UNINHABITED';
  const loyaltyColor = (planet.loyalty ?? 0) < 20 ? '#ff2244' : (planet.loyalty ?? 0) < 40 ? '#ffaa00' : '#00e5ff';
  const moraleColor  = (planet.morale  ?? 0) < 30 ? '#ff4466' : (planet.morale  ?? 0) < 60 ? '#ffaa00' : '#00ff88';

  // Calcola netto produzione
  const production  = planet.resource_flow?.production  ?? planet.natural_resources ?? {};
  const consumption = planet.resource_flow?.consumption ?? {};
  const allKeys     = [...new Set([...Object.keys(production), ...Object.keys(consumption)])];
  const netFlow     = allKeys.map(k => ({
    key: k, net: (production[k] ?? 0) - (consumption[k] ?? 0),
    meta: RESOURCE_META[k] ?? { icon: '?', color: '#888', label: k },
  })).filter(r => r.net !== 0);

  const popPct = planet.max_population
    ? Math.round((planet.population ?? 0) / planet.max_population * 100)
    : null;

  const handleColonize = async () => {
    if (!onColonize) return;
    setColonizing(true);
    setActionMsg(null);
    try {
      const updated = await onColonize(planet.id);
      setActionMsg({ text: 'Colonizzazione avviata!', ok: true });
      if (updated) onPlanetUpdate?.(updated);
    } catch (e: any) {
      setActionMsg({ text: e?.response?.data?.message ?? 'Errore', ok: false });
    } finally {
      setColonizing(false);
    }
  };

  // CSS per tab button
  const tabBtn = (t: Tab) => ({
    flex: 1 as const, padding: '8px 4px', border: 'none', cursor: 'pointer' as const,
    background: tab === t ? 'rgba(0,229,255,0.1)' : 'transparent',
    color: tab === t ? '#00e5ff' : '#444',
    fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const,
    fontFamily: '"Share Tech Mono", monospace',
    borderBottom: tab === t ? '1px solid #00e5ff' : '1px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      position: 'fixed', right: 0, top: 44, width: 320, bottom: 0,
      background: 'rgba(0,4,12,0.97)',
      borderLeft: '1px solid rgba(0,229,255,0.12)',
      zIndex: 150,
      fontFamily: '"Share Tech Mono", monospace',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(0,229,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Pianeta visivo */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: bgGrad,
            boxShadow: `0 0 20px ${status.color}33, inset 0 0 20px rgba(0,0,0,0.4)`,
            flexShrink: 0,
            position: 'relative',
          }}>
            {/* Anello per gas giant */}
            {planet.type?.toUpperCase() === 'GAS_GIANT' && (
              <div style={{
                position: 'absolute', top: '50%', left: -8, right: -8,
                height: 8, borderRadius: '50%',
                background: 'rgba(136,68,170,0.3)',
                border: '1px solid rgba(136,68,170,0.4)',
                transform: 'translateY(-50%) rotateX(70deg)',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, color: '#fff', letterSpacing: 2, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {planet.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>
              {planet.type?.replace('_', ' ')}
            </div>
            <span style={{
              fontSize: 9, color: status.color, letterSpacing: 2,
              padding: '2px 8px', border: `1px solid ${status.color}44`,
              background: `${status.color}11`, borderRadius: 2,
              boxShadow: status.glow,
            }}>
              {status.label}
            </span>
          </div>

          <span onClick={onClose} style={{ color: '#333', cursor: 'pointer', fontSize: 16, flexShrink: 0, lineHeight: 1 }}>✕</span>
        </div>

        {/* Loyalty alert */}
        {(planet.loyalty ?? 100) < 20 && planet.status !== 'UNINHABITED' && (
          <div style={{
            marginTop: 10, padding: '6px 10px', background: 'rgba(255,34,68,0.1)',
            border: '1px solid rgba(255,34,68,0.3)', borderRadius: 3,
            fontSize: 10, color: '#ff4466', letterSpacing: 1,
          }}>
            ⚠ REBELLION RISK — Loyalty critical
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,229,255,0.08)', flexShrink: 0 }}>
        <button style={tabBtn('overview')}   onClick={() => setTab('overview')}>Overview</button>
        <button style={tabBtn('production')} onClick={() => setTab('production')}>Production</button>
        <button style={tabBtn('buildings')}  onClick={() => setTab('buildings')}>Buildings</button>
        <button style={tabBtn('actions')}    onClick={() => setTab('actions')}>Actions</button>
      </div>

      {/* ── Contenuto scrollabile ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div>
            {/* Statistiche rapide */}
            {!isUninhabited && (
              <>
                <SectionTitle>POPULATION</SectionTitle>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Inhabitants</span>
                    <span style={{ fontSize: 13, color: '#fff' }}>
                      {(planet.population ?? 0).toLocaleString()}
                      {popPct !== null && <span style={{ fontSize: 10, color: '#444', marginLeft: 6 }}>/ {planet.max_population?.toLocaleString()}</span>}
                    </span>
                  </div>
                  {popPct !== null && (
                    <StatBar value={popPct} color="#00e5ff" showValue={false} />
                  )}
                  {popPct !== null && (
                    <div style={{ fontSize: 10, color: '#444', textAlign: 'right', marginTop: 4 }}>
                      {popPct}% capacity
                    </div>
                  )}
                </div>

                <SectionTitle>STABILITY</SectionTitle>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Loyalty</span>
                  </div>
                  <StatBar value={planet.loyalty ?? 0} color={loyaltyColor} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Morale</span>
                  </div>
                  <StatBar value={planet.morale ?? 0} color={moraleColor} />
                </div>

                {/* Loyalty breakdown */}
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Loyalty threshold (rebellion)</span>
                    <span style={{ fontSize: 10, color: '#ff2244' }}>20</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Loyalty threshold (unstable)</span>
                    <span style={{ fontSize: 10, color: '#ffaa00' }}>40</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Current loyalty</span>
                    <span style={{ fontSize: 10, color: loyaltyColor }}>{Math.round(planet.loyalty ?? 0)}</span>
                  </div>
                </div>
              </>
            )}

            {isUninhabited && (
              <>
                <SectionTitle>PLANET DATA</SectionTitle>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Habitability</span>
                  </div>
                  <StatBar
                    value={planet.habitability ?? 0}
                    color={(planet.habitability ?? 0) > 60 ? '#00ff88' : (planet.habitability ?? 0) > 30 ? '#ffaa00' : '#ff4466'}
                  />
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                  This planet is uninhabited. Colonize it to begin resource extraction and population growth.
                </div>
              </>
            )}

            {/* Risorse naturali */}
            {Object.keys(planet.natural_resources ?? {}).length > 0 && (
              <>
                <SectionTitle>NATURAL RESOURCES</SectionTitle>
                {Object.entries(planet.natural_resources ?? {})
                  .filter(([_, v]) => v > 0)
                  .map(([k, v]) => {
                    const meta = RESOURCE_META[k] ?? { icon: '?', color: '#888', label: k };
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: meta.color, fontSize: 12, width: 16, textAlign: 'center' }}>{meta.icon}</span>
                        <span style={{ fontSize: 11, color: '#666', flex: 1 }}>{meta.label}</span>
                        <div style={{ width: 60 }}>
                          <StatBar value={v} max={20} color={meta.color} showValue={false} />
                        </div>
                        <span style={{ fontSize: 11, color: '#888', minWidth: 24, textAlign: 'right' }}>{v}</span>
                      </div>
                    );
                  })}
              </>
            )}

            {/* Owner info */}
            <div style={{ marginTop: 16 }}>
              <SectionTitle>CONTROL</SectionTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#555' }}>Owner</span>
                <span style={{ fontSize: 11, color: isOwned ? '#00e5ff' : '#888' }}>
                  {planet.owner_id ? (isOwned ? 'YOUR EMPIRE' : 'FOREIGN') : '—'}
                </span>
              </div>
              {planet.controller_id && planet.controller_id !== planet.owner_id && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#555' }}>Controller</span>
                  <span style={{ fontSize: 11, color: '#ffaa00' }}>DELEGATED</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PRODUCTION ═══ */}
        {tab === 'production' && (
          <div>
            {netFlow.length > 0 ? (
              <>
                <SectionTitle>RESOURCE FLOW / TICK</SectionTitle>
                {netFlow
                  .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
                  .map(({ key, net, meta }) => (
                    <ResourceRow key={key} icon={meta.icon} label={meta.label} value={net} color={meta.color} />
                  ))}

                {/* Totale crediti */}
                <div style={{
                  marginTop: 16, padding: '10px 12px',
                  background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.15)',
                  borderRadius: 4,
                }}>
                  <div style={{ fontSize: 10, color: '#ffcc00', marginBottom: 6, letterSpacing: 2 }}>ECONOMY SUMMARY</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#666' }}>Net income / tick</span>
                    <span style={{ fontSize: 12, color: '#ffcc00' }}>
                      {(netFlow.find(r => r.key === 'CREDITS')?.net ?? 0) > 0 ? '+' : ''}
                      {(netFlow.find(r => r.key === 'CREDITS')?.net ?? 0).toFixed(1)} CR
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#333', fontSize: 12 }}>
                {isUninhabited
                  ? 'Colonize this planet to start production.'
                  : 'No resource flow data available yet.'}
              </div>
            )}

            {/* Dettaglio produzione grezza */}
            {Object.keys(production).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <SectionTitle>RAW PRODUCTION</SectionTitle>
                {Object.entries(production).filter(([_, v]) => v > 0).map(([k, v]) => {
                  const meta = RESOURCE_META[k] ?? { icon: '?', color: '#888', label: k };
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ color: meta.color, fontSize: 11 }}>{meta.icon}</span>
                      <span style={{ fontSize: 11, color: '#555', flex: 1 }}>{meta.label}</span>
                      <span style={{ fontSize: 11, color: '#00ff88' }}>+{v}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(consumption).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <SectionTitle>CONSUMPTION</SectionTitle>
                {Object.entries(consumption).filter(([_, v]) => v > 0).map(([k, v]) => {
                  const meta = RESOURCE_META[k] ?? { icon: '?', color: '#888', label: k };
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ color: meta.color, fontSize: 11 }}>{meta.icon}</span>
                      <span style={{ fontSize: 11, color: '#555', flex: 1 }}>{meta.label}</span>
                      <span style={{ fontSize: 11, color: '#ff4466' }}>−{v}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ BUILDINGS ═══ */}
        {tab === 'buildings' && (
          <div>
            <SectionTitle>INSTALLED STRUCTURES</SectionTitle>
            {(planet.buildings?.length ?? 0) === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 30, color: '#333', fontSize: 12, lineHeight: 1.8 }}>
                No structures built.<br />
                <span style={{ fontSize: 10 }}>Go to Actions to start construction.</span>
              </div>
            ) : (
              planet.buildings?.map((b: any, i: number) => (
                <div key={i} style={{
                  padding: '10px 12px', marginBottom: 8,
                  background: 'rgba(255,255,255,0.03)', borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>
                    {(b.type ?? b.name ?? 'Unknown Structure').replace(/_/g, ' ')}
                  </div>
                  {b.level && (
                    <div style={{ fontSize: 10, color: '#555' }}>Level {b.level}</div>
                  )}
                </div>
              ))
            )}

            {/* Build queue futura */}
            <div style={{ marginTop: 20 }}>
              <SectionTitle>BUILD QUEUE</SectionTitle>
              <div style={{
                padding: '10px 12px', background: 'rgba(0,229,255,0.03)',
                border: '1px solid rgba(0,229,255,0.1)', borderRadius: 4,
                fontSize: 11, color: '#444', textAlign: 'center',
              }}>
                Build queue — coming soon
              </div>
            </div>
          </div>
        )}

        {/* ═══ ACTIONS ═══ */}
        {tab === 'actions' && (
          <div>
            {actionMsg && (
              <div style={{
                marginBottom: 14, padding: '8px 12px',
                background: actionMsg.ok ? 'rgba(0,255,136,0.08)' : 'rgba(255,34,68,0.08)',
                border: `1px solid ${actionMsg.ok ? 'rgba(0,255,136,0.3)' : 'rgba(255,34,68,0.3)'}`,
                borderRadius: 4, fontSize: 11,
                color: actionMsg.ok ? '#00ff88' : '#ff4466',
              }}>
                {actionMsg.text}
              </div>
            )}

            {/* Colonizza */}
            {isUninhabited && (
              <>
                <SectionTitle>COLONIZATION</SectionTitle>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.7, marginBottom: 14 }}>
                  Send a colony fleet to establish a settlement on this planet. Requires a fleet in orbit.
                </div>
                <div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Habitability</span>
                    <span style={{ fontSize: 10, color: (planet.habitability ?? 0) > 60 ? '#00ff88' : '#ffaa00' }}>
                      {Math.round(planet.habitability ?? 0)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: '#555' }}>Type</span>
                    <span style={{ fontSize: 10, color: '#888' }}>{planet.type}</span>
                  </div>
                </div>
                <ActionButton
                  label="COLONIZE PLANET"
                  color="#00ff88"
                  loading={colonizing}
                  onClick={handleColonize}
                />
              </>
            )}

            {/* Azioni pianeti colonizzati */}
            {!isUninhabited && isOwned && (
              <>
                <SectionTitle>MANAGEMENT</SectionTitle>

                <ActionButton
                  label="SEND SUPPLY FLEET"
                  color="#00e5ff"
                  onClick={() => setActionMsg({ text: 'Use Fleet Command to move a fleet here.', ok: true })}
                />

                <div style={{ height: 8 }} />

                <ActionButton
                  label="DECLARE MARTIAL LAW"
                  color="#ffaa00"
                  onClick={() => setActionMsg({ text: 'Martial law: +loyalty, -morale. Feature coming soon.', ok: false })}
                  disabled
                />

                <div style={{ height: 8 }} />

                <ActionButton
                  label="ABANDON PLANET"
                  color="#ff2244"
                  onClick={() => setActionMsg({ text: 'Planet abandonment not yet implemented.', ok: false })}
                  disabled
                />
              </>
            )}

            {!isUninhabited && !isOwned && (
              <>
                <SectionTitle>FOREIGN PLANET</SectionTitle>
                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.8 }}>
                  You do not control this planet. Use diplomacy or military force to contest it.
                </div>
              </>
            )}

            {/* Info stato tick */}
            <div style={{ marginTop: 24 }}>
              <SectionTitle>TICK INFO</SectionTitle>
              <div style={{ fontSize: 10, color: '#333', lineHeight: 1.8 }}>
                Stats update every tick (60s in production).<br />
                Loyalty and morale change based on food supply and fleet presence.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ label, color, onClick, loading = false, disabled = false }: {
  label: string; color: string;
  onClick: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '10px', border: `1px solid ${disabled ? '#333' : color + '88'}`,
        background: disabled ? 'transparent' : `${color}11`,
        color: disabled ? '#333' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 10, letterSpacing: 2,
        fontFamily: '"Share Tech Mono", monospace',
        borderRadius: 4, transition: 'all 0.15s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '...' : label}
    </button>
  );
}
