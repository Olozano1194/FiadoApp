import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock @tauri-apps/plugin-store globally so authStore's dynamic import resolves
// to a controllable mock. Returning null from Store.load forces authStore to
// fall through to the localStorage path (the default for jsdom tests).
vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn().mockResolvedValue(null),
  },
}));
