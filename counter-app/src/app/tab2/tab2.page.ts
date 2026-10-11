import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { SavedCounter } from '../models/saved-counter';
import { CounterService } from '../services/counter.service';

type SortOrder = 'newest' | 'oldest' | 'name' | 'value';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    DatePipe,
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab2Page implements OnInit {
  readonly counterService = inject(CounterService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly searchTerm = signal('');
  readonly sortOrder = signal<SortOrder>('newest');

  readonly totalValue = computed(() =>
    this.counterService.counters().reduce((sum, counter) => sum + counter.value, 0),
  );

  // Min/max ze všech uložených záznamů, ne z výsledků hledání; prázdná historie → null.
  readonly minValue = computed(() => {
    const values = this.counterService.counters().map((counter) => counter.value);
    return values.length > 0 ? Math.min(...values) : null;
  });

  readonly maxValue = computed(() => {
    const values = this.counterService.counters().map((counter) => counter.value);
    return values.length > 0 ? Math.max(...values) : null;
  });

  readonly visibleCounters = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const order = this.sortOrder();

    return this.counterService
      .counters()
      .filter((counter) => counter.name.toLowerCase().includes(term))
      .sort((a, b) => this.compare(a, b, order));
  });

  async ngOnInit(): Promise<void> {
    await this.counterService.initialize();
  }

  async remove(id: string): Promise<void> {
    await this.counterService.remove(id);

    const toast = await this.toastController.create({
      message: 'Záznam byl odstraněn.',
      duration: 2000,
      position: 'top',
    });
    await toast.present();
  }

  async confirmClear(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Vymazat historii?',
      message: 'Všechny uložené záznamy budou trvale odstraněny.',
      buttons: [
        { text: 'Zrušit', role: 'cancel' },
        { text: 'Vymazat', role: 'destructive' },
      ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();

    if (role === 'destructive') {
      await this.clear();
    }
  }

  async clear(): Promise<void> {
    await this.counterService.clear();
  }

  private compare(a: SavedCounter, b: SavedCounter, order: SortOrder): number {
    switch (order) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return a.name.localeCompare(b.name, 'cs');
      case 'value':
        return b.value - a.value;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }
}
