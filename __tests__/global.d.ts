// Type definitions for global test utilities
type MockWebSocketInstance = {
  _triggerMessage: (data: any) => void;
  url: string;
  readyState: number;
  send: (data: string | ArrayBuffer | Blob | ArrayBufferView) => void;
  close: (code?: number, reason?: string) => void;
  onopen: ((this: WebSocket, ev: Event) => any) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
  onerror: ((this: WebSocket, ev: Event) => any) | null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
};

// Export to make this file a module
export {};

declare global {
  // Test utilities
  const getMockWebSocketInstances: () => MockWebSocketInstance[];
  const simulateServerMessage: (message: any, instanceIndex?: number) => void;
  const mockWebSocketInstances: MockWebSocketInstance[];
  const mockWebSocketConstructor: jest.Mock;

  // Extend the global WebSocket type
  interface WebSocket {
    _triggerMessage?: (data: any) => void;
  }

  // For Node.js environment
  namespace NodeJS {
    interface Global {
      mockWebSocketInstances: MockWebSocketInstance[];
      getMockWebSocketInstances: () => MockWebSocketInstance[];
      simulateServerMessage: (message: any, instanceIndex?: number) => void;
      WebSocket: typeof WebSocket;
      mockWebSocketConstructor: jest.Mock;
    }
  }

  // For browser environment
  interface Window {
    mockWebSocketInstances: MockWebSocketInstance[];
    getMockWebSocketInstances: () => MockWebSocketInstance[];
    simulateServerMessage: (message: any, instanceIndex?: number) => void;
    mockWebSocketConstructor: jest.Mock;
  }
}
