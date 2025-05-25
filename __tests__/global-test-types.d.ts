// Global test-only variables for TypeScript
// This file makes TypeScript aware of globals set up in test setup files

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mockWebSocketConstructor: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mockWebSocketInstances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var simulateServerMessage: (message: any, instanceIndex?: number) => void;
  // Optionally, add getMockWebSocketInstances if used
  // var getMockWebSocketInstances: () => any[];
}

export {};
