import React, { useEffect, useRef } from 'react';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axios_instance';
import { APP_BASE_URL } from '../store/types';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from './authProvider';


const WebSocketComponent: React.FC = () => {
  const navigation: any = useNavigation();
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_BACKOFF_MS = 30000;


  useEffect(() => {
    const fetchCollectionData = async (collectionId: string) => {
      try {
        const url = `${APP_BASE_URL}api/collection/${collectionId}?page=1&limit=100`;
        const { data } = await axiosInstance.get(url);

        const collectionRes = data.value;
        const imageLinks: string[] = [];

        collectionRes.forEach((item: any) => {
          imageLinks.push(item?.link);
        });

        if (imageLinks.length > 0) {
          navigation.navigate('StreamImagePage', {
            imageCollection: imageLinks,
            collectionId: collectionId,
          });
        }
      } catch (error) {
        console.error('Error fetching collection data', error);
      }
    };

    const findCollectionIdDeep = (obj: any): string | undefined => {
      if (!obj || typeof obj !== 'object') {
        return undefined;
      }
      if (typeof obj.collectionId === 'string' && obj.collectionId.length > 0) {
        return obj.collectionId;
      }
      for (const key of Object.keys(obj)) {
        const val = (obj as any)[key];
        const found = findCollectionIdDeep(val);
        if (found) {
          return found;
        }
      }
      return undefined;
    };

    const extractCollectionId = (eventData: string | object): string | undefined => {
      try {
        // If it's a string JSON, parse it
        if (typeof eventData === 'string') {
          // Quick regex search in raw payload to handle non-JSON bodies like 'Stream {"collectionId":"..."}' or similar
          const regex = /"collectionId"\s*:\s*"([^"]+)"/;
          const m = eventData.match(regex);
          if (m && m[1]) {
            return m[1];
          }
          // Try parse full string as JSON
          const maybeObj = JSON.parse(eventData);
          return findCollectionIdDeep(maybeObj);
        }
        // If it's already an object, search deeply
        return findCollectionIdDeep(eventData);
      } catch (_) {
        return undefined;
      }
    };

    const findImageLinksDeep = (obj: any): string[] | undefined => {
      if (!obj) {
        return undefined;
      }
      // If it's an array of strings (urls), return it
      if (Array.isArray(obj) && obj.every(x => typeof x === 'string')) {
        return obj as string[];
      }
      // If it's an array of objects with link field
      if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
        const maybeLinks = obj.map((x: any) => x?.link).filter((x: any) => typeof x === 'string');
        if (maybeLinks.length === obj.length) {
          return maybeLinks;
        }
      }
      if (typeof obj === 'object') {
        const keys = ['imageCollection', 'images', 'imageLinks', 'links'];
        for (const k of keys) {
          if (k in obj) {
            const result = findImageLinksDeep((obj as any)[k]);
            if (result && result.length > 0) {
              return result;
            }
          }
        }
        for (const key of Object.keys(obj)) {
          const val = (obj as any)[key];
          const found = findImageLinksDeep(val);
          if (found && found.length > 0) {
            return found;
          }
        }
      }
      return undefined;
    };

    const cleanupWebSocket = () => {
      try {
        if (wsRef.current) {
          // Detach handlers to avoid firing after close
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.close();
        }
      } catch (_) { }
      wsRef.current = null;
    };

    const scheduleReconnect = () => {
      if (!isAuthenticated) {
        // Do not reconnect when logged out
        return;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      const delay = Math.min(MAX_BACKOFF_MS, Math.pow(2, retryRef.current) * 1000);
      reconnectTimerRef.current = setTimeout(() => {
        retryRef.current = Math.min(retryRef.current + 1, 10);
        initialize();
      }, delay);
    };

    const establishWebSocketConnection = (url: string, body: any) => {
      // Ensure a single active connection
      cleanupWebSocket();
      const ws = new WebSocket(url, 'graphql-ws');
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          ws.send(JSON.stringify(body));
          retryRef.current = 0; // reset backoff after successful open
        } catch (err) {
          console.error('WebSocket send error', err);
          Toast.show({ type: 'error', text1: 'WebSocket send failed' });
        }
      };

      ws.onmessage = event => {
        if (!isAuthenticated) {
          return;
        }
        try {
          const raw = event?.data;
          // Some servers send string data; others send JSON with nested payload
          if (typeof raw === 'string') {
            // Attempt fast-path extraction from raw text
            // Try to get direct image links first
            const linksFromRaw = findImageLinksDeep(raw);
            if (linksFromRaw && linksFromRaw.length > 0) {
              navigation.navigate('StreamImagePage', {
                imageCollection: linksFromRaw,
                collectionId: '',
              });
              return;
            }
            const fromRaw = extractCollectionId(raw);
            if (fromRaw) {
              fetchCollectionData(fromRaw);
              return;
            }
            // Try JSON parse the top-level
            const parsedTop = JSON.parse(raw);
            const maybeData = parsedTop?.payload?.data?.subscribe?.data ?? parsedTop?.payload?.data ?? parsedTop?.data ?? parsedTop;
            // Try links from parsed object
            const links = findImageLinksDeep(maybeData);
            if (links && links.length > 0) {
              navigation.navigate('StreamImagePage', {
                imageCollection: links,
                collectionId: '',
              });
              return;
            }
            const id = extractCollectionId(maybeData);
            if (id) {
              fetchCollectionData(id);
              return;
            }
          } else if (raw) {
            const links = findImageLinksDeep(raw as any);
            if (links && links.length > 0) {
              navigation.navigate('StreamImagePage', {
                imageCollection: links,
                collectionId: '',
              });
              return;
            }
            const id = extractCollectionId(raw as any);
            if (id) {
              fetchCollectionData(id);
              return;
            }
          }
          // If we get here, we couldn't extract an id; log once
          console.warn('WebSocket message received but no collectionId found');
        } catch (e) {
          console.warn('WebSocket message parse error', e);
        }
      };

      ws.onclose = () => {
        // Attempt to reconnect on close
        Toast.show({ type: 'info', text1: 'Stream disconnected' });
        scheduleReconnect();
      };

      ws.onerror = error => {
        console.error('WebSocket error', error);
        Toast.show({ type: 'error', text1: 'WebSocket error' });
        try {
          ws.close();
        } catch (_) { }
      };
    };

    const initialize = async () => {
      if (!isAuthenticated) {
        // If not authenticated, ensure connection is closed and do nothing
        cleanupWebSocket();
        return;
      }
      try {
        const deviceId = await DeviceInfo.getUniqueId();

        const url = `${APP_BASE_URL}api/streaming/appsync/subscribe/requests`;

        const response = await axiosInstance.post(url, { channel: deviceId });

        const data = response.data;

        if (data.isSuccess) {
          const webSocketUrl = data.value.url;
          const webSocketBody = data.value.body;

          await AsyncStorage.setItem('webSocketUrl', webSocketUrl);

          establishWebSocketConnection(webSocketUrl, webSocketBody);

          // Proactive refresh before 1 hour expiration (55 minutes)
          if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
          }
          refreshTimerRef.current = setTimeout(() => {
            initialize();
          }, 55 * 60 * 1000);
        } else {
          console.error('Failed to get WebSocket URL', data.message);
          Toast.show({ type: 'error', text1: 'Failed to subscribe to stream' });
        }
      } catch (error) {
        console.error('Error fetching WebSocket URL', error);
        // Network or API issue; schedule retry
        // Toast.show({type: 'error', text1: 'Stream subscribe failed, retrying...'});
        scheduleReconnect();
      }
    };

    initialize();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      cleanupWebSocket();
    };
  }, [navigation, isAuthenticated]);

  return null;
};

export default WebSocketComponent;
