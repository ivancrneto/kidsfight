// Global mocks and configurations for Jest

// Mock window object
if (typeof window !== 'undefined') {
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
}

// Mock requestAnimationFrame
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0);
  };
}

// Mock cancelAnimationFrame
if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;
