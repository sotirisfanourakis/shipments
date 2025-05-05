import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentComponent } from './shipment.component';
import { ShipmentService } from './shipment.service';
import { Paged, Shipment } from './shipment';
import { defer } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ShipmentComponent', () => {
  let component: ShipmentComponent;
  let fixture: ComponentFixture<ShipmentComponent>;
  let shipmentService: jasmine.SpyObj<ShipmentService>;

  const shipments: Paged<Shipment> = {
    page: 0,
    size: 10,
    totalElements: 100,
    totalPages: 10,
    content: [
      {
        id: 1,
        name: 'Olympia Carlesi',
        status: 'Shipped',
        createDate: '2024-05-07T08:57:01Z',
        receiptDate: '2025-01-03T13:15:48Z',
      },
      {
        id: 2,
        name: 'Ellery Beeke',
        status: 'Pending',
        createDate: '2024-03-14T22:17:17Z',
        receiptDate: '2025-07-08T01:03:07Z',
      },
      {
        id: 3,
        name: 'Kendra Albrooke',
        status: 'Delivered',
        createDate: '2024-07-23T16:45:41Z',
        receiptDate: '2025-03-13T22:26:44Z',
      },
      {
        id: 4,
        name: 'Giffie Philipot',
        status: 'Pending',
        createDate: '2024-07-10T18:05:31Z',
        receiptDate: '2025-02-02T00:05:58Z',
      },
      {
        id: 5,
        name: 'Fiorenze Pickup',
        status: 'Pending',
        createDate: '2024-03-13T19:03:10Z',
        receiptDate: '2025-08-20T04:24:42Z',
      },
      {
        id: 6,
        name: 'Gib Offord',
        status: 'Delivered',
        createDate: '2024-10-17T03:14:20Z',
        receiptDate: '2025-10-04T09:13:57Z',
      },
      {
        id: 7,
        name: 'Mayne Rysdale',
        status: 'Delivered',
        createDate: '2024-09-18T10:25:33Z',
        receiptDate: '2025-02-28T10:54:01Z',
      },
      {
        id: 8,
        name: 'Emmy Ogelsby',
        status: 'Shipped',
        createDate: '2024-02-16T22:59:01Z',
        receiptDate: '2025-09-24T11:47:48Z',
      },
      {
        id: 9,
        name: 'Letisha Morillas',
        status: 'Delivered',
        createDate: '2024-06-26T17:32:26Z',
        receiptDate: '2025-06-08T00:07:30Z',
      },
      {
        id: 10,
        name: 'Kev Silcocks',
        status: 'Delivered',
        createDate: '2024-03-19T04:08:57Z',
        receiptDate: '2025-03-11T23:29:25Z',
      },
    ],
  };

  beforeEach(async () => {
    shipmentService = jasmine.createSpyObj<ShipmentService>('ShipmentService', [
      'getShipments',
    ]);
    await TestBed.configureTestingModule({
      imports: [ShipmentComponent],
      providers: [{ provide: ShipmentService, useValue: shipmentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 100));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const asyncData = <T>(data: T) => defer(() => Promise.resolve(data));

  it('should return first page', async () => {
    shipmentService.getShipments.and.returnValue(asyncData(shipments));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(shipmentService.getShipments).toHaveBeenCalled();

    const rows = fixture.debugElement.queryAll(By.css('.ag-row'));
    expect(rows.length).toBe(10);
  });

  it('should render first row data', async () => {
    const createDate = component['adjustLocalTimeToUtc'](
      shipments.content[0].createDate,
    );
    const formattedCreateDate = `${component['padNumber'](createDate.getDate())}/${component['padNumber'](createDate.getMonth() + 1)}/${createDate.getFullYear()} ${component['padNumber'](createDate.getHours())}:${component['padNumber'](createDate.getMinutes())}`;
    const receiptDate = component['adjustLocalTimeToUtc'](
      shipments.content[0].receiptDate,
    );
    const formattedReceiptDate = `${component['padNumber'](receiptDate.getDate())}/${component['padNumber'](receiptDate.getMonth() + 1)}/${receiptDate.getFullYear()} ${component['padNumber'](receiptDate.getHours())}:${component['padNumber'](receiptDate.getMinutes())}`;

    shipmentService.getShipments.and.returnValue(asyncData(shipments));
    await fixture.whenStable();
    fixture.detectChanges();
    const firstRowCells = fixture.debugElement.queryAll(
      By.css('.ag-row-first .ag-cell'),
    );
    expect(firstRowCells[0].nativeElement.textContent.trim()).toBe('');
    expect(firstRowCells[1].nativeElement.textContent.trim()).toBe(
      `${shipments.content[0].id}`,
    );
    expect(firstRowCells[2].nativeElement.textContent.trim()).toBe(
      shipments.content[0].name,
    );
    expect(firstRowCells[3].nativeElement.textContent.trim()).toBe(
      shipments.content[0].status,
    );
    expect(firstRowCells[4].nativeElement.textContent.trim()).toBe(
      formattedCreateDate,
    );
    expect(firstRowCells[5].nativeElement.textContent.trim()).toBe(
      formattedReceiptDate,
    );
  });

  it('should return filtered value', async () => {
    shipmentService.getShipments
      .withArgs({ page: 0, size: 10 })
      .and.returnValue(asyncData(shipments));
    shipmentService.getShipments
      .withArgs({ page: 0, size: 10, filter: 'carlesi' })
      .and.returnValue(
        asyncData({
          ...shipments,
          content: [shipments.content[0]],
        }),
      );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(shipmentService.getShipments).toHaveBeenCalled();

    component.filter.setValue('carlesi');
    await fixture.whenStable();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(shipmentService.getShipments).toHaveBeenCalledWith({
      page: 0,
      size: 10,
      filter: 'carlesi',
    });
  });
});
