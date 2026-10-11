import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from '../services/counter.service';
import { Tab1Page } from './tab1.page';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  let addMock: Mock;
  let toastCreateMock: Mock;

  beforeEach(() => {
    addMock = vi.fn().mockResolvedValue(undefined);
    toastCreateMock = vi.fn().mockResolvedValue({ present: vi.fn() });

    TestBed.configureTestingModule({
      providers: [
        { provide: CounterService, useValue: { add: addMock } },
        { provide: ToastController, useValue: { create: toastCreateMock } },
      ],
    });

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass the saved counter to the service and show a toast', async () => {
    const counter: SavedCounter = {
      id: 'first',
      name: 'První',
      value: 1,
      createdAt: '2026-09-17T08:00:00.000Z',
    };

    await component.onSaved(counter);

    expect(addMock).toHaveBeenCalledWith(counter);
    expect(toastCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Počítadlo „První“ bylo uloženo.' }),
    );
  });
});
