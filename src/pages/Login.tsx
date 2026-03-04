// pages/Login.tsx
import { useState } from 'react';
import { Auth } from '../hooks/useApi';
import { useGameStore } from '../store/game.store';

const COLORS = ['#00e5ff','#ff2244','#00ff88','#ffaa00','#aa44ff','#ff8800','#44aaff'];

export default function Login() {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [empireName, setEmpireName] = useState('');
  const [empireColor, setEmpireColor] = useState('#00e5ff');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const setAuth = useGameStore(s => s.setAuth);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await Auth.login({ username, password });
      } else {
        data = await Auth.register({ username, email, password, empire_name: empireName, empire_color: empireColor });
      }
      setAuth(data.access_token, data.empire_id, data.username);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#050a14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Share Tech Mono", monospace',
    }}>
      {/* Starfield background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 120 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() > 0.9 ? 2 : 1,
            height: Math.random() > 0.9 ? 2 : 1,
            background: '#fff',
            opacity: Math.random() * 0.7 + 0.1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            borderRadius: '50%',
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', width: 420, padding: '40px',
        background: 'rgba(0,10,25,0.92)', border: '1px solid rgba(0,229,255,0.2)',
        boxShadow: '0 0 40px rgba(0,229,255,0.08)', borderRadius: 8,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: '#00e5ff', opacity: 0.7, marginBottom: 8 }}>
            YEAR 2847 — SECTOR COMMAND
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: 2, fontFamily: 'Orbitron, sans-serif' }}>
            GALACTIC EMPIRE
          </div>
          <div style={{ fontSize: 11, color: '#00e5ff', opacity: 0.5, marginTop: 6, letterSpacing: 3 }}>
            STRATEGIC COMMAND INTERFACE
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: 3 }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', borderRadius: 3,
              background: mode === m ? 'rgba(0,229,255,0.15)' : 'transparent',
              color: mode === m ? '#00e5ff' : '#666',
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: 'inherit',
            }}>
              {m === 'login' ? 'Access Terminal' : 'New Commander'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="COMMANDER ID" value={username} onChange={setUsername} placeholder="username" />
          {mode === 'register' && (
            <Field label="COMM CHANNEL" value={email} onChange={setEmail} placeholder="email@domain.com" type="email" />
          )}
          <Field label="ACCESS CODE" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {mode === 'register' && <>
            <Field label="EMPIRE DESIGNATION" value={empireName} onChange={setEmpireName} placeholder="e.g. Iron Dominion" />
            <div>
              <div style={{ fontSize: 10, color: '#00e5ff', opacity: 0.6, marginBottom: 6, letterSpacing: 2 }}>
                EMPIRE SIGNATURE COLOR
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setEmpireColor(c)} style={{
                    width: 28, height: 28, borderRadius: 4, background: c, cursor: 'pointer',
                    border: empireColor === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: empireColor === c ? `0 0 10px ${c}` : 'none',
                    transition: 'all 0.15s',
                  }} />
                ))}
              </div>
            </div>
          </>}
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px', background: 'rgba(255,34,68,0.1)',
            border: '1px solid rgba(255,34,68,0.3)', borderRadius: 4,
            color: '#ff2244', fontSize: 12,
          }}>
            ⚠ {error}
          </div>
        )}

        <button
          onClick={submit} disabled={loading}
          style={{
            width: '100%', marginTop: 24, padding: '13px', border: '1px solid #00e5ff',
            background: loading ? 'transparent' : 'rgba(0,229,255,0.08)',
            color: '#00e5ff', fontSize: 12, letterSpacing: 3, cursor: 'pointer',
            fontFamily: 'inherit', borderRadius: 4, textTransform: 'uppercase',
            opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
          }}
        >
          {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ENTER COMMAND CENTER' : 'FORGE YOUR EMPIRE'}
        </button>

        {mode === 'login' && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#444' }}>
            Demo account: <span style={{ color: '#00e5ff', opacity: 0.7 }}>demo / demo1234</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#00e5ff', opacity: 0.6, marginBottom: 5, letterSpacing: 2 }}>
        {label}
      </div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(0,229,255,0.2)', color: '#c0d8e8',
          borderRadius: 4, fontSize: 13, outline: 'none', boxSizing: 'border-box',
          fontFamily: '"Share Tech Mono", monospace',
        }}
      />
    </div>
  );
}
