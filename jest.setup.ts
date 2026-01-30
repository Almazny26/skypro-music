import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.load = jest.fn();
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = jest.fn();
}

const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = args[0];
    if (
      typeof msg === 'string' &&
      msg.includes('An update to') &&
      msg.includes('was not wrapped in act')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});
afterAll(() => {
  console.error = originalError;
});
