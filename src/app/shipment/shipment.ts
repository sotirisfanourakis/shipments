export interface Paged<T> {
  content: T[],
  page: number,
  size: number,
  totalElements: number,
  totalPages: number,
}

export interface Shipment {
  createDate: string,
  id: number,
  name: string;
  receiptDate: string,
  status: 'Pending' | 'Shipped' | 'Delivered',
}
