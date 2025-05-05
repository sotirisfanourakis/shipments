import { Component, DestroyRef } from '@angular/core';
import { ShipmentService } from './shipment.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, ModuleRegistry } from 'ag-grid-community';
import {
  AllCommunityModule,
  AllEnterpriseModule,
  CellEditRequestEvent,
  FilterModel,
  GetRowIdParams,
  GridApi,
  IServerSideDatasource,
  RowSelectedEvent,
  ValueFormatterParams,
} from 'ag-grid-enterprise';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  defer,
  EMPTY,
  finalize,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Shipment } from './shipment';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';

ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule]);

const minDate =
  (min: Date): ValidatorFn =>
  (control: AbstractControl) =>
    control.value instanceof Date && control.value.valueOf() < min?.valueOf()
      ? { min: { 'en-gb': `The date must be future date` } }
      : null;

@Component({
  selector: 'app-shipment',
  standalone: true,
  imports: [
    AgGridAngular,
    AsyncPipe,
    ButtonModule,
    ConfirmPopupModule,
    DatePickerModule,
    DialogModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    SelectModule,
    ToastModule,
  ],
  templateUrl: './shipment.component.html',
  styleUrl: './shipment.component.css',
  providers: [ConfirmationService, MessageService],
})
export class ShipmentComponent {
  private dateFormatter = (params: ValueFormatterParams): string =>
    `${this.padNumber(params.value.getDate())}/${this.padNumber(params.value.getMonth() + 1)}/${params.value.getFullYear()} ${this.padNumber(params.value.getHours())}:${this.padNumber(params.value.getMinutes())}`;

  colDefs: ColDef[] = [
    {
      field: 'id',
      lockPosition: 'left',
      resizable: false,
      sortable: false,
      type: 'rightAligned',
      width: 100,
    },
    {
      field: 'name',
      lockVisible: true,
      resizable: false,
      width: 200,
    },
    {
      field: 'status',
      filter: 'agSetColumnFilter',
      filterParams: {
        values: ['Pending', 'Shipped', 'Delivered'],
      },
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Pending', 'Shipped', 'Delivered'],
      },
      lockVisible: true,
      resizable: false,
      width: 200,
    },
    {
      field: 'createDate',
      lockVisible: true,
      resizable: false,
      valueFormatter: this.dateFormatter,
      width: 240,
    },
    {
      field: 'receiptDate',
      lockVisible: true,
      resizable: false,
      valueFormatter: this.dateFormatter,
      width: 240,
    },
  ];
  datasource: IServerSideDatasource | undefined = undefined;
  readonly filter = new FormControl('');
  readonly form = new FormGroup({
    name: new FormControl(null as string | null, Validators.required),
    status: new FormControl(
      'Pending' as 'Pending' | 'Shipped' | 'Delivered' | null,
      Validators.required,
    ),
    receiptDate: new FormControl(null as Date | null, [
      Validators.required,
      minDate(new Date()),
    ]),
  });
  gridApi: GridApi | null = null;
  rowsToDelete: Shipment[] = [];
  readonly isCreateLoading$ = new BehaviorSubject(false);
  readonly isDeleteLoading$ = new BehaviorSubject(false);
  isDialogVisible = false;
  readonly isLoading$ = new BehaviorSubject(false);
  readonly minDate = new Date();
  totalElements: number = 0;

  constructor(
    private readonly confirmationService: ConfirmationService,
    private readonly destroyRef: DestroyRef,
    private readonly messageService: MessageService,
    private readonly shipmentService: ShipmentService,
  ) {}

  createServerSideDatasource(): IServerSideDatasource {
    return {
      getRows: (params) => {
        const page = params.request.startRow! / 10;

        defer(() => {
          return this.filter.valueChanges.pipe(
            tap(() => this.isLoading$.next(true)),
            takeUntilDestroyed(this.destroyRef),
            startWith(this.filter.value),
            debounceTime(500),
            switchMap((filter) => {
              const reqParams = {
                page,
                size: 10,
                ...(filter && { filter: filter as string }),
                ...(params.request.sortModel.length > 0 && {
                  sort: params.request.sortModel.map(
                    (value) => `${value.colId},${value.sort}`,
                  ),
                }),
              };
              const request =
                'status' in params.request.filterModel!
                  ? this.shipmentService.getShipmentsByStatus({
                      ...reqParams,
                      status: (params.request.filterModel as FilterModel)[
                        'status'
                      ].values,
                    })
                  : this.shipmentService.getShipments(reqParams);

              return request.pipe(
                tap((pagedShipments) => {
                  this.totalElements = pagedShipments.totalElements;
                }),
                map(({ content }) => content),
                catchError((error) => {
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error,
                    life: 3000,
                  });
                  params.fail();
                  return of([]);
                }),
                finalize(() => this.isLoading$.next(false)),
              );
            }),
          );
        }).subscribe((shipments) => {
          if (shipments.length === 0) {
            this.gridApi?.setGridOption('loading', false);
            this.gridApi?.showNoRowsOverlay();
          }
          params.success({
            rowData: shipments.map((shipment) => ({
              ...shipment,
              createDate: this.adjustLocalTimeToUtc(shipment.createDate),
              receiptDate: this.adjustLocalTimeToUtc(shipment.receiptDate),
            })),
            rowCount: this.totalElements,
          });
        });
      },
    };
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.datasource = this.createServerSideDatasource();
  }

  readonly getRowId = (params: GetRowIdParams) => String(params.data.id);

  createShipment(): void {
    const { name, status, receiptDate } = this.form.value;
    this.isCreateLoading$.next(true);
    this.shipmentService
      .createShipment({
        name: name!,
        status: status!,
        createDate: this.adjustUtcToLocalTime(new Date()).toISOString(),
        receiptDate: this.adjustUtcToLocalTime(receiptDate!).toISOString(),
      })
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error,
            life: 3000,
          });

          return EMPTY;
        }),
        finalize(() => this.isCreateLoading$.next(false)),
      )
      .subscribe((shipment) => {
        this.gridApi?.applyServerSideTransaction({
          add: [
            {
              ...shipment,
              createDate: this.adjustLocalTimeToUtc(shipment.createDate),
              receiptDate: this.adjustLocalTimeToUtc(shipment.receiptDate),
            },
          ],
        });
        this.isDialogVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Edit',
          detail: `New shipment created successfully.`,
          life: 3000,
        });
      });
  }

  deleteShipments(event: Event): void {
    this.confirmationService.confirm({
      target: event.target!,
      message: `Are you sure you want to delete ${this.rowsToDelete.length} selected shipments?`,
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },
      accept: () => {
        this.isDeleteLoading$.next(true);
        this.isLoading$.next(true);
        this.shipmentService
          .deleteShipments(this.rowsToDelete.map((shipment) => shipment.id))
          .pipe(
            catchError((error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error,
                life: 3000,
              });

              return EMPTY;
            }),
            finalize(() => {
              this.isDeleteLoading$.next(false);
              this.isLoading$.next(false);
            }),
          )
          .subscribe((response) => {
            this.gridApi?.applyServerSideTransaction({
              remove: this.rowsToDelete,
            });
            this.gridApi?.deselectAll();
            this.rowsToDelete = [];
            this.messageService.add({
              severity: 'info',
              summary: 'Confirmed',
              detail: response,
              life: 3000,
            });
          });
      },
    });
  }

  editRow(row: CellEditRequestEvent): void {
    const body = {
      ...row.data,
      createDate: this.adjustUtcToLocalTime(row.data.createDate),
      receiptDate: this.adjustUtcToLocalTime(row.data.receiptDate),
      [row.colDef.field as string]: row.newValue,
    };
    this.isLoading$.next(true);
    this.shipmentService
      .updateShipment(body)
      .pipe(
        catchError((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error,
            life: 3000,
          });

          return EMPTY;
        }),
        finalize(() => this.isLoading$.next(false)),
      )
      .subscribe(() => {
        this.gridApi?.applyServerSideTransaction({ update: [body] });
        this.messageService.add({
          severity: 'success',
          summary: 'Edit',
          detail: `Shipment with id: ${body.id} updated successfully.`,
          life: 3000,
        });
      });
  }

  selectRow(row: RowSelectedEvent): void {
    const index = this.rowsToDelete.findIndex((id) => id === row.data.id);

    if (index > -1) {
      this.rowsToDelete.splice(index, 1);
    } else {
      this.rowsToDelete.push(row.data);
    }
  }

  openDialog(): void {
    this.form.reset({
      name: null,
      status: 'Pending',
      receiptDate: null,
    });
    this.isDialogVisible = true;
  }

  private adjustUtcToLocalTime(timestamp: Date): Date {
    const date = new Date(timestamp);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  }

  private adjustLocalTimeToUtc(utcTimestamp: string): Date {
    const date = new Date(utcTimestamp);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  }

  private padNumber = (num: number): string => String(num).padStart(2, '0');
}
