// hooks/useGameSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket }        from 'socket.io-client';
import { useGameStore }      from '../store/game.store';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:4000';

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, setConnected, applyTickDelta, setCurrentTick, addNotification } = useGameStore();

  useEffect(() => {
    if (!token) return;

    const socket = io(`${WS_URL}/game`, {
      auth:          { token },
      transports:    ['websocket'],
      reconnection:  true,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[WS] Connected');
      socket.emit('request:snapshot');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('[WS] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });

    // Snapshot iniziale (dati al momento della connessione)
    socket.on('state:snapshot', (data: any) => {
      if (data.current_tick) setCurrentTick(data.current_tick);
    });

    // Delta tick (aggiornamento ogni tick)
    socket.on('tick:delta', (delta: any) => {
      applyTickDelta(delta);

      // Diplomacy delta annidato
      if (delta.diplomacy) {
        if (delta.diplomacy.proposals?.length) {
          delta.diplomacy.proposals.forEach((p: any) => {
            addNotification({
              type: 'PROPOSAL', title: `New proposal: ${p.type}`,
              description: p.summary, tick: delta.tick,
            });
          });
        }
        if (delta.diplomacy.wars?.filter((w: any) => w.is_new).length) {
          delta.diplomacy.wars.filter((w: any) => w.is_new).forEach((w: any) => {
            addNotification({
              type: 'WAR', title: '⚠️ War Declared!',
              description: `A new war has started. Casus belli: ${w.casus_belli}`,
              tick: delta.tick,
            });
          });
        }
      }
    });

    // Evento globale (wormhole discovery, crisi galattica, ecc.)
    socket.on('tick:global', (event: any) => {
      if (event.events?.length) {
        event.events.forEach((ev: any) => {
          addNotification({
            type: ev.type ?? 'GLOBAL', title: ev.title ?? 'Galactic Event',
            description: ev.description ?? '', tick: event.tick,
          });
        });
      }
    });

    // Risposte approvazione deleghe
    socket.on('approval_responses', (data: any) => {
      if (data?.approved !== undefined) {
        addNotification({
          type: 'APPROVAL',
          title: data.approved ? '✅ Action Approved' : '❌ Action Rejected',
          description: `Your request for ${data.action} on entity ${data.entity_id} was ${data.approved ? 'approved' : 'rejected'}.`,
          tick: 0,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const sendEventChoice = (event_id: string, choice_id: string) => {
    socketRef.current?.emit('event:choice', { event_id, choice_id });
  };

  const setView = (view: 'galaxy' | 'system' | 'planet', target_id?: string) => {
    socketRef.current?.emit('client:view', { view, target_id });
  };

  return { sendEventChoice, setView };
}
