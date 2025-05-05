import { TestBed } from '@angular/core/testing';

import { ShipmentService } from './shipment.service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Paged, Shipment } from './shipment';

describe('ShipmentService', () => {
  let service: ShipmentService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShipmentService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request shipments', () => {
    service
      .getShipments({ page: 0, size: 10 })
      .subscribe((data) => expect(data).toEqual(shipments));

    const req = httpTestingController.expectOne(
      'http://shipments?page=0&size=10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(shipments);
  });

  it('should request shipments by name', () => {
    service
      .getShipments({ page: 0, size: 10, filter: 'carlesi' })
      .subscribe((data) =>
        expect(data).toEqual({
          size: 10,
          page: 0,
          totalElements: 1,
          totalPages: 1,
          content: [
            {
              id: 1,
              name: 'Olympia Carlesi',
              status: 'Shipped',
              createDate: '2024-05-07T08:57:01Z',
              receiptDate: '2025-01-03T13:15:48Z',
            },
          ],
        }),
      );

    const req = httpTestingController.expectOne(
      'http://shipments?page=0&size=10&filter=carlesi',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      size: 10,
      page: 0,
      totalElements: 1,
      totalPages: 1,
      content: [
        {
          id: 1,
          name: 'Olympia Carlesi',
          status: 'Shipped',
          createDate: '2024-05-07T08:57:01Z',
          receiptDate: '2025-01-03T13:15:48Z',
        },
      ],
    });
  });

  it('should request shipments by status', () => {
    service
      .getShipmentsByStatus({ page: 0, size: 10, status: ['Pending'] })
      .subscribe((data) =>
        expect(data).toEqual({
          size: 10,
          page: 0,
          totalElements: 3,
          totalPages: 1,
          content: [
            {
              id: 2,
              name: 'Ellery Beeke',
              status: 'Pending',
              createDate: '2024-03-14T22:17:17Z',
              receiptDate: '2025-07-08T01:03:07Z',
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
          ],
        }),
      );

    const req = httpTestingController.expectOne(
      'http://shipments?page=0&size=10&status=Pending',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      size: 10,
      page: 0,
      totalElements: 3,
      totalPages: 1,
      content: [
        {
          id: 2,
          name: 'Ellery Beeke',
          status: 'Pending',
          createDate: '2024-03-14T22:17:17Z',
          receiptDate: '2025-07-08T01:03:07Z',
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
      ],
    });
  });

  it('should return empty list if no shipment found by name', () => {
    service
      .getShipments({ page: 0, size: 10, filter: 'noname' })
      .subscribe(({ content }) => expect(content).toEqual([]));

    const req = httpTestingController.expectOne(
      'http://shipments?page=0&size=10&filter=noname',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      size: 10,
      page: 0,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
  });

  it('should update shipment', () => {
    service
      .updateShipment({
        id: 1,
        name: 'Olympia Carlesi',
        status: 'Pending',
        createDate: '2024-05-07T08:57:01.000Z',
        receiptDate: '2025-01-03T13:15:48.000Z',
      })
      .subscribe((shipment) =>
        expect(shipment).toEqual({
          id: 1,
          name: 'Olympia Carlesi',
          status: 'Pending',
          createDate: '2024-05-07T08:57:01.000Z',
          receiptDate: '2025-01-03T13:15:48.000Z',
        }),
      );

    const req = httpTestingController.expectOne('http://shipments');
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 1,
      name: 'Olympia Carlesi',
      status: 'Pending',
      createDate: '2024-05-07T08:57:01.000Z',
      receiptDate: '2025-01-03T13:15:48.000Z',
    });
  });

  it('should delete shipment', () => {
    service
      .deleteShipments([1])
      .subscribe((response) =>
        expect(response).toEqual(`Shipment deleted successfully.`),
      );

    const req = httpTestingController.expectOne('http://shipments');
    expect(req.request.method).toBe('DELETE');
    req.flush(`Shipment deleted successfully.`);
  });
});
