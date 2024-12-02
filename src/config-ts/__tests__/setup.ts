// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
    value: {
        ...global.window,
        game: undefined,
    },
    writable: true
});

// Mock performance.now()
Object.defineProperty(global, 'performance', {
    value: {
        ...global.performance,
        now: () => Date.now(),
    },
    writable: true
});
