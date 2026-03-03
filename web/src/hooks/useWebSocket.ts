import { useCallback, useEffect, useRef, useState } from "react";

export const WS_MAX_RETRIES = 4;
export const WS_BASE_DELAY = 1000;
export const WS_MAX_DELAY = 16000;

export interface UseWebSocketOptions<T> {
  url: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseWebSocketReturn {
  connected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useWebSocket<T = unknown>({
  url,
  enabled = true,
  onMessage,
  onConnect,
  onDisconnect,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const connectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onMessage, onConnect, onDisconnect]);

  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url || !enabled) return;

    cleanup();

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        setError(null);
        retryCountRef.current = 0;
        onConnectRef.current?.();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          onMessageRef.current?.(data);
        } catch (e) {
          console.error("Error parsing WebSocket data:", e);
        }
      };

      socket.onclose = (event) => {
        setConnected(false);
        onDisconnectRef.current?.();

        if (event.code === 1000) return;

        retryCountRef.current += 1;
        if (retryCountRef.current <= WS_MAX_RETRIES) {
          const delay = Math.min(
            WS_BASE_DELAY * Math.pow(2, retryCountRef.current - 1),
            WS_MAX_DELAY
          );
          console.log(
            `WebSocket: tentativa ${retryCountRef.current}/${WS_MAX_RETRIES} em ${delay}ms`
          );
          retryTimeoutRef.current = setTimeout(() => {
            connectRef.current?.();
          }, delay);
        } else {
          setError("Não foi possível conectar com o servidor");
        }
      };

      socket.onerror = () => {
      };
    } catch {
      setError("Não foi possível conectar com o servidor");
    }
  }, [url, enabled, cleanup]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    connect();
  }, [connect]);

  useEffect(() => {
    if (enabled && url) {
      queueMicrotask(connect);
    }
    return cleanup;
  }, [enabled, url, connect, cleanup]);

  return {
    connected,
    error,
    reconnect,
  };
}
