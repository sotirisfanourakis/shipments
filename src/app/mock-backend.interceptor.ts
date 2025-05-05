import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { mockData } from './testing/testing';
import { delay, of } from 'rxjs';
import { Shipment } from './shipment/shipment';

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url !== 'http://shipments') {
    return next(req);
  } else {
    const page = Number(req.params.get('page') || 0);
    const size = Number(req.params.get('size') || 10);

    //Change boolean values to check error responses
    const errors = {
      get: false,
      post: false,
      put: false,
      delete: false,
    };

    const status = req.params.getAll('status');
    const filter = req.params.get('filter');
    const sort = req.params.getAll('sort');
    let newData: Shipment | null = null;

    if (req.method === 'POST') {
      if (errors.post) {
        throw new HttpErrorResponse({
          error: `Could not create new shipment.`,
          status: 500,
          statusText: `Error`,
          url: `http://shipments`,
        });
      }
      newData = {
        ...(req.body as Shipment),
        id: mockData[mockData.length - 1].id + 1,
      };
      mockData.push(newData);
    } else if (req.method === 'PUT') {
      if (errors.put) {
        throw new HttpErrorResponse({
          error: `Could not update shipment with id: ${(req.body as Shipment).id}.`,
          status: 500,
          statusText: `Error`,
          url: `http://shipments`,
        });
      }

      const index = mockData.findIndex(
        (data) => data.id === (req.body as Shipment).id,
      );

      if (index > -1) {
        mockData[index] = req.body as Shipment;
      }
    } else if (req.method === 'DELETE') {
      if (errors.delete) {
        throw new HttpErrorResponse({
          error: `Could not delete selected ${(req.body as number[]).length > 1 ? `shipments` : `shipment`}.`,
          status: 500,
          statusText: `Error`,
          url: `http://shipments`,
        });
      }

      (req.body as number[]).forEach((id) => {
        const index = mockData.findIndex((data) => data.id === id);

        if (index > -1) {
          mockData.splice(index, 1);
        }
      });
    } else {
      if (errors.get) {
        throw new HttpErrorResponse({
          error: `Could not retrieve shipments.`,
          status: 500,
          statusText: `Error`,
          url: `http://shipments`,
        });
      }
    }

    const responseData =
      !filter && !status
        ? [...mockData]
        : !filter && status
          ? [...mockData].filter((shipment) => status.includes(shipment.status))
          : filter && !status
            ? [...mockData].filter((shipment) =>
                shipment.name.toLowerCase().includes(filter.toLowerCase()),
              )
            : [...mockData].filter(
                (shipment) =>
                  status!.includes(shipment.status) &&
                  shipment.name.toLowerCase().includes(filter!.toLowerCase()),
              );

    sort?.reverse().forEach((sorting) => {
      const field = sorting.split(',')[0];
      const order = sorting.split(',')[1];

      if (field === 'name' || field === 'status') {
        if (order === 'asc') {
          responseData.sort((a, b) => a[field].localeCompare(b[field]));
        } else {
          responseData.sort((a, b) => b[field].localeCompare(a[field]));
        }
      } else if (field === 'createDate' || field === 'receiptDate') {
        if (order === 'asc') {
          responseData.sort(
            (a, b) =>
              new Date(a[field]).valueOf() - new Date(b[field]).valueOf(),
          );
        } else {
          responseData.sort(
            (a, b) =>
              new Date(b[field]).valueOf() - new Date(a[field]).valueOf(),
          );
        }
      }
    });

    return req.method === 'GET'
      ? of(
          new HttpResponse({
            status: 200,
            body: {
              size,
              page,
              totalElements: responseData.length,
              totalPages: Math.ceil(responseData.length / size),
              content: responseData.slice(page * size, page * size + 10),
            },
          }),
        ).pipe(delay(1000))
      : req.method === 'DELETE'
        ? of(
            new HttpResponse({
              status: 200,
              body: `${(req.body as number[]).length > 1 ? `Shipments` : `Shipment`} deleted successfully.`,
            }),
          ).pipe(delay(1000))
        : of(
            new HttpResponse({
              status: 200,
              body: (req.body as Shipment).id ? req.body : newData,
            }),
          ).pipe(delay(1000));
  }
};
