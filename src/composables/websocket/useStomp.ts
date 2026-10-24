import { AuthStorage } from "@/utils/auth";
import { cleanupWebSocket } from "@/plugins/websocket";
import { ref } from "vue";

export interface UseStompOptions {
  /** WebSocket 地址，不传时使用 VITE_APP_WS_ENDPOINT 环境变量 */
  brokerURL?: string;
  /** 重连延迟，单位毫秒，默认为 8000 */
  reconnectDelay?: number;
  /** 最大重连次数，默认为 5 */
  maxReconnectAttempts?: number;
}

interface SocketEnvelope {
  type?: string;
  topic?: string;
  payload?: any;
  message?: string;
  timestamp?: number;
}

export interface SocketMessage {
  body: string;
  envelopeType?: string;
  topic?: string;
  payload?: any;
}

type SocketCallback = (_message: SocketMessage) => void;

const socketRef = ref<WebSocket | null>(null);
const connectedRef = ref(false);
const reconnectCountRef = ref(0);
const topicListeners = new Map<string, Map<string, SocketCallback>>();
let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null;
let isConnecting = false;
let isManualDisconnect = false;

function destinationToTopic(destination: string) {
  switch (destination) {
    case "/topic/online-count":
      return "online-count";
    case "/topic/dict":
      return "dict";
    case "/user/queue/message":
      return "notification";
    default:
      return destination.replace(/^\//, "");
  }
}

function topicToEnvelope(topic: string, type: "SUBSCRIBE" | "UNSUBSCRIBE") {
  return JSON.stringify({ type, topic });
}

function dispatchEnvelope(envelope: SocketEnvelope) {
  if (envelope.type === "FORCE_OFFLINE") {
    ElMessage.error(envelope.message || "实时连接已被管理员断开");
    cleanupWebSocket();
    return;
  }
  if (!envelope.topic) {
    return;
  }
  const listeners = topicListeners.get(envelope.topic);
  if (!listeners || listeners.size === 0) {
    return;
  }
  const body = JSON.stringify(
    typeof envelope.payload === "undefined" ? envelope : envelope.payload
  );
  listeners.forEach((callback) => callback({
    body,
    envelopeType: envelope.type,
    topic: envelope.topic,
    payload: envelope.payload,
  }));
}

function resubscribeTopics() {
  if (!socketRef.value || socketRef.value.readyState !== WebSocket.OPEN) {
    return;
  }
  topicListeners.forEach((listeners, topic) => {
    if (listeners.size > 0) {
      socketRef.value!.send(topicToEnvelope(topic, "SUBSCRIBE"));
    }
  });
}

/**
 * 兼容旧调用方式的实时 WebSocket 组合式函数
 */
export function useStomp(options: UseStompOptions = {}) {
  const defaultBrokerURL = import.meta.env.VITE_APP_WS_ENDPOINT || "";
  const brokerURL = ref(options.brokerURL ?? defaultBrokerURL);
  const reconnectDelay = options.reconnectDelay ?? 5000;
  const maxReconnectAttempts = options.maxReconnectAttempts ?? 5;

  const handleReconnect = () => {
    if (isConnecting || isManualDisconnect) {
      return;
    }

    if (reconnectCountRef.value >= maxReconnectAttempts) {
      console.error(`已达到最大重连次数(${maxReconnectAttempts})，停止重连`);
      return;
    }

    reconnectCountRef.value++;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
    }
    reconnectTimer = setTimeout(() => {
      if (!connectedRef.value && !isManualDisconnect && !isConnecting) {
        connect();
      }
    }, reconnectDelay);
  };

  const connect = () => {
    isManualDisconnect = false;
    if (!brokerURL.value) {
      console.error("WebSocket连接失败: 未配置WebSocket端点URL");
      return;
    }

    if (isConnecting || connectedRef.value) {
      return;
    }

    if (!AuthStorage.getAccessToken()) {
      return;
    }

    isConnecting = true;
    try {
      socketRef.value = new WebSocket(brokerURL.value);
      socketRef.value.onopen = () => {
        connectedRef.value = true;
        isConnecting = false;
        reconnectCountRef.value = 0;
        resubscribeTopics();
      };
      socketRef.value.onmessage = (event) => {
        try {
          const envelope = JSON.parse(event.data) as SocketEnvelope;
          dispatchEnvelope(envelope);
        } catch (error) {
          console.warn("解析实时消息失败", error);
        }
      };
      socketRef.value.onerror = () => {
        isConnecting = false;
      };
      socketRef.value.onclose = () => {
        connectedRef.value = false;
        isConnecting = false;
        socketRef.value = null;
        if (!isManualDisconnect) {
          handleReconnect();
        }
      };
    } catch (error) {
      console.error("建立实时连接失败", error);
      isConnecting = false;
    }
  };

  const subscribe = (destination: string, callback: SocketCallback): string => {
    const topic = destinationToTopic(destination);
    const subscriptionId = `${topic}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const listeners = topicListeners.get(topic) ?? new Map<string, SocketCallback>();
    const shouldSubscribeServer = listeners.size === 0;
    listeners.set(subscriptionId, callback);
    topicListeners.set(topic, listeners);
    if (connectedRef.value && shouldSubscribeServer && socketRef.value) {
      socketRef.value.send(topicToEnvelope(topic, "SUBSCRIBE"));
    }
    return subscriptionId;
  };

  const unsubscribe = (subscriptionId: string) => {
    topicListeners.forEach((listeners, topic) => {
      if (!listeners.has(subscriptionId)) {
        return;
      }
      listeners.delete(subscriptionId);
      if (listeners.size === 0) {
        topicListeners.delete(topic);
        if (connectedRef.value && socketRef.value) {
          socketRef.value.send(topicToEnvelope(topic, "UNSUBSCRIBE"));
        }
      }
    });
  };

  const disconnect = () => {
    isManualDisconnect = true;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socketRef.value) {
      socketRef.value.close();
      socketRef.value = null;
    }
    connectedRef.value = false;
    isConnecting = false;
    reconnectCountRef.value = 0;
  };

  const send = (destination: string, body?: any) => {
    if (!socketRef.value || socketRef.value.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      if (destination === "/app/online-count/init") {
        socketRef.value.send(topicToEnvelope("online-count", "SUBSCRIBE"));
        return true;
      }
      socketRef.value.send(
        typeof body === "string" ? body : JSON.stringify(body ?? { type: destinationToTopic(destination) })
      );
      return true;
    } catch (err) {
      console.error("发送实时消息失败", err);
      return false;
    }
  };

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    isConnected: connectedRef,
    brokerURL,
    reconnectCount: reconnectCountRef,
  };
}
