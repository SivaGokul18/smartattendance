import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '../api/client';

export interface LiveCheckinEvent {
  type: 'STUDENT_CHECKIN';
  sessionId: string;
  data: {
    id: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    department: string;
    markedAt: string;
    method: string;
    faceVerified: boolean;
    confidenceScore: number;
    overrideReason?: string;
  };
}

export interface SessionStatusEvent {
  type: 'SESSION_STATUS_CHANGED';
  sessionId: string;
  status: 'broadcasting' | 'ended';
  summary?: any;
}

export type LiveSessionEvent = LiveCheckinEvent | SessionStatusEvent;

export const useFacultyLiveSession = (
  sessionId: string | null | undefined,
  onEvent?: (event: LiveSessionEvent) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const wsUrl = getWebSocketUrl(`/faculty/session/${sessionId}/live`);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Start ping heartbeat every 20 seconds
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
        (ws as any)._heartbeat = heartbeatInterval;
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const parsed = JSON.parse(event.data);
          onEvent?.(parsed);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if ((ws as any)._heartbeat) clearInterval((ws as any)._heartbeat);
        // Auto-reconnect after 3 seconds if component still mounted
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error in faculty live session:', err);
      };
    } catch (err) {
      console.warn('Could not establish WebSocket connection:', err);
    }
  }, [sessionId, onEvent]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        if ((socketRef.current as any)._heartbeat) clearInterval((socketRef.current as any)._heartbeat);
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
};

export const useAdminLiveOversight = (onEvent?: (event: LiveSessionEvent) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = getWebSocketUrl('/admin/live-oversight');

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const parsed = JSON.parse(event.data);
          onEvent?.(parsed);
        } catch (e) {
          console.error('Error parsing admin oversight message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('Could not connect to admin live oversight:', err);
    }

    return () => {
      socketRef.current?.close();
    };
  }, [onEvent]);

  return { isConnected };
};
