import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from './counter.service';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('CounterService', () => {
  let service: CounterService;

  const getMock = vi.mocked(Preferences.get);
  const setMock = vi.mocked(Preferences.set);
  const removeMock = vi.mocked(Preferences.remove);

  const first: SavedCounter = {
    id: 'first',
    name: 'První',
    value: 1,
    createdAt: '2026-09-17T08:00:00.000Z',
  };

  const second: SavedCounter = {
    id: 'second',
    name: 'Druhé',
    value: 2,
    createdAt: '2026-09-17T09:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    getMock.mockResolvedValue({ value: null });

    setMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [CounterService],
    });

    service = TestBed.inject(CounterService);
  });

  it('should initialize only once', async () => {
    await Promise.all([service.initialize(), service.initialize()]);

    await service.initialize();

    expect(getMock).toHaveBeenCalledTimes(1);

    expect(service.initialized()).toBe(true);
    expect(service.counters()).toEqual([]);
  });

  it('should load saved counters on initialize', async () => {
    getMock.mockResolvedValue({ value: JSON.stringify([first, second]) });

    await service.initialize();

    expect(service.counters()).toEqual([first, second]);
    expect(service.initialized()).toBe(true);
    expect(getMock).toHaveBeenCalledWith({ key: 'saved-counters' });
  });

  it('should add a counter to the beginning and persist it', async () => {
    getMock.mockResolvedValue({ value: JSON.stringify([first]) });

    await service.add(second);

    expect(service.counters()).toEqual([second, first]);
    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith({
      key: 'saved-counters',
      value: JSON.stringify([second, first]),
    });
  });

  it('should remove only the matching counter and persist the rest', async () => {
    getMock.mockResolvedValue({ value: JSON.stringify([second, first]) });

    await service.remove('second');

    expect(service.counters()).toEqual([first]);
    expect(setMock).toHaveBeenCalledWith({
      key: 'saved-counters',
      value: JSON.stringify([first]),
    });
  });

  it('should clear the history and remove only its key', async () => {
    getMock.mockResolvedValue({ value: JSON.stringify([first, second]) });

    await service.clear();

    expect(service.counters()).toEqual([]);
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith({ key: 'saved-counters' });
    expect(setMock).not.toHaveBeenCalled();
  });

  it('should recover from invalid JSON', async () => {
    getMock.mockResolvedValue({ value: 'this is not a valid JSON' });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await service.initialize();

    expect(service.counters()).toEqual([]);
    expect(service.initialized()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'Historii počítadel se nepodařilo načíst.',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });

  it('should recover from JSON that is not an array', async () => {
    getMock.mockResolvedValue({ value: JSON.stringify({ name: 'test' }) });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await service.initialize();

    expect(service.counters()).toEqual([]);
    expect(service.initialized()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith(
      'Historii počítadel se nepodařilo načíst.',
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
