import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, EMPTY, Observable } from 'rxjs';
import { Paged, Shipment } from './shipment';

@Injectable({
  providedIn: 'root',
})
export class ShipmentService {
  private readonly shipments$ = new BehaviorSubject<Shipment[]>([]);

  constructor(private readonly http: HttpClient) {}

  set shipments(shipments: Shipment[]) {
    this.shipments$.next(shipments);
  }

  get shipments(): Observable<Shipment[]> {
    return this.shipments$.asObservable();
  }

  getShipments(params: {
    page: number;
    size: number;
    filter?: string;
    sort?: string[];
  }): Observable<Paged<Shipment>> {
    return this.http.get<Paged<Shipment>>(`http://shipments`, { params });
  }

  getShipmentsByStatus(params: {
    page: number;
    size: number;
    status: string[];
    filter?: string;
    sort?: string[];
  }): Observable<Paged<Shipment>> {
    return this.http.get<Paged<Shipment>>(`http://shipments`, { params });
  }

  createShipment(body: Omit<Shipment, 'id'>): Observable<Shipment> {
    return this.http.post<Shipment>(`http://shipments`, body);
  }

  updateShipment(body: Shipment): Observable<Shipment> {
    return this.http.put<Shipment>(`http://shipments`, body);
  }

  deleteShipments(ids: number[]): Observable<string> {
    return this.http.delete<string>(`http://shipments`, { body: ids });
  }
}
