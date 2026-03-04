// src/App.tsx
import { useEffect } from 'react';
import { useGameStore } from './store/game.store';
import { useGameSocket } from './hooks/useGameSocket';
import { Empires, Systems } from './hooks/useApi';
import Login from './pages/Login';
import Game  from './pages/Game';

export default function App() {
  const token    = useGameStore(s => s.token);
  const setEmpire  = useGameStore(s => s.setEmpire);
  const setSystems = useGameStore(s => s.setSystems);

  // Avvia il socket solo quando loggati
  useGameSocket();

  // Ricarica dati empire ad ogni login
  useEffect(() => {
    if (!token) return;
    Empires.me().then(setEmpire).catch(() => useGameStore.getState().logout());
    Systems.list().then(setSystems).catch(console.error);
  }, [token]);

  return token ? <Game /> : <Login />;
}
