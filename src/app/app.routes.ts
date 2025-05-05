import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    title: 'Shipment',
    path: '',
    loadComponent: () =>
      import('./shipment/shipment.component').then(
        (mod) => mod.ShipmentComponent,
      ),
  },
  {
    title: 'Shipment',
    path: 'shipments',
    loadComponent: () =>
      import('./shipment/shipment.component').then(
        (mod) => mod.ShipmentComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
