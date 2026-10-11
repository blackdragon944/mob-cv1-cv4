import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, ToastController } from '@ionic/angular';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from '../services/counter.service';
import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let counters: WritableSignal<SavedCounter[]>;
  let removeMock: Mock;
  let clearMock: Mock;
  let toastCreateMock: Mock;
  let alertRole: string;

  const visitors: SavedCounter = {
    id: 'visitors',
    name: 'Návštěvníci',
    value: 5,
    createdAt: '2026-09-17T08:00:00.000Z',
  };

  const cars: SavedCounter = {
    id: 'cars',
    name: 'auta',
    value: 2,
    createdAt: '2026-09-17T09:00:00.000Z',
  };

  const readers: SavedCounter = {
    id: 'readers',
    name: 'Čtenáři',
    value: 9,
    createdAt: '2026-09-17T10:00:00.000Z',
  };

  beforeEach(() => {
    counters = signal<SavedCounter[]>([]);
    removeMock = vi.fn().mockResolvedValue(undefined);
    clearMock = vi.fn().mockResolvedValue(undefined);
    toastCreateMock = vi.fn().mockResolvedValue({ present: vi.fn() });
    alertRole = 'cancel';

    TestBed.configureTestingModule({
      providers: [
        {
          provide: CounterService,
          useValue: {
            counters: counters.asReadonly(),
            initialized: signal(true).asReadonly(),
            initialize: vi.fn().mockResolvedValue(undefined),
            remove: removeMock,
            clear: clearMock,
          },
        },
        {
          provide: AlertController,
          useValue: {
            create: vi.fn().mockImplementation(async () => ({
              present: vi.fn(),
              onDidDismiss: async () => ({ role: alertRole }),
            })),
          },
        },
        { provide: ToastController, useValue: { create: toastCreateMock } },
      ],
    });

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sum values of all saved counters', () => {
    expect(component.totalValue()).toBe(0);

    counters.set([readers, cars, visitors]);

    expect(component.totalValue()).toBe(16);
  });

  it('should sort the history without changing the data in the service', () => {
    counters.set([visitors, readers, cars]);

    expect(component.visibleCounters()).toEqual([readers, cars, visitors]);

    component.sortOrder.set('oldest');
    expect(component.visibleCounters()).toEqual([visitors, cars, readers]);

    component.sortOrder.set('name');
    expect(component.visibleCounters()).toEqual([cars, readers, visitors]);

    component.sortOrder.set('value');
    expect(component.visibleCounters()).toEqual([readers, visitors, cars]);

    expect(counters()).toEqual([visitors, readers, cars]);
  });

  it('should search by name regardless of letter case', () => {
    counters.set([readers, cars, visitors]);

    component.searchTerm.set('NÁV');

    expect(component.visibleCounters()).toEqual([visitors]);
  });

  it('should show a message when nothing matches the search', () => {
    counters.set([readers, cars, visitors]);
    component.searchTerm.set('xyz');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(component.visibleCounters()).toEqual([]);
    expect(text).toContain('Žádný záznam neodpovídá hledání');
  });

  it('should clear the history only after confirmation', async () => {
    alertRole = 'cancel';
    await component.confirmClear();
    expect(clearMock).not.toHaveBeenCalled();

    alertRole = 'destructive';
    await component.confirmClear();
    expect(clearMock).toHaveBeenCalledTimes(1);
  });

  describe('min a max (varianta B)', () => {
    it('should return null for an empty history', () => {
      expect(component.minValue()).toBeNull();
      expect(component.maxValue()).toBeNull();
    });

    it('should use the same value for min and max with one record', () => {
      counters.set([visitors]);

      expect(component.minValue()).toBe(5);
      expect(component.maxValue()).toBe(5);
    });

    it('should find min and max among more records and show them', () => {
      counters.set([visitors, cars, readers]);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent;

      expect(component.minValue()).toBe(2);
      expect(component.maxValue()).toBe(9);
      expect(text).toContain('Minimum: 2');
      expect(text).toContain('Maximum: 9');
    });

    it('should ignore the search filter and update after removal', () => {
      counters.set([visitors, cars, readers]);
      component.searchTerm.set('auta');

      expect(component.visibleCounters()).toEqual([cars]);
      expect(component.minValue()).toBe(2);
      expect(component.maxValue()).toBe(9);

      counters.set([visitors, readers]);
      expect(component.minValue()).toBe(5);
    });
  });

  it('should remove a counter and show a toast', async () => {
    await component.remove('cars');

    expect(removeMock).toHaveBeenCalledWith('cars');
    expect(toastCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Záznam byl odstraněn.' }),
    );
  });
});
