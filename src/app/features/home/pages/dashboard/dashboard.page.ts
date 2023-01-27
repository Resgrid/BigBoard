import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import {
  KtdDragEnd,
  KtdDragStart,
  KtdGridComponent,
  KtdGridLayout,
  KtdResizeEnd,
  KtdResizeStart,
  ktdTrackById,
  ktdGridCompact,
} from '@katoid/angular-grid-layout';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { debounceTime, filter, fromEvent, merge, Subscription } from 'rxjs';
import { Widget } from 'src/app/models/widget';

@Component({
  selector: 'app-home-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage {
  @ViewChild(KtdGridComponent, { static: true }) grid: KtdGridComponent;
  trackById = ktdTrackById;

  cols = 12;
  rowHeight = 50;
  rowHeightFit = false;
  gridHeight: null | number = null;
  compactType: 'vertical' | 'horizontal' | null = 'vertical';

  public widgets: Widget[] = [];

  layout: KtdGridLayout = [
    { id: '0', x: 5, y: 0, w: 2, h: 3 },
    { id: '1', x: 2, y: 2, w: 1, h: 2 },
    { id: '2', x: 3, y: 7, w: 1, h: 2 },
    { id: '3', x: 2, y: 0, w: 3, h: 2 },
    { id: '4', x: 5, y: 3, w: 2, h: 3 },
    { id: '5', x: 0, y: 4, w: 1, h: 3 },
    { id: '6', x: 9, y: 0, w: 2, h: 4 },
    { id: '7', x: 9, y: 4, w: 2, h: 2 },
    { id: '8', x: 3, y: 2, w: 2, h: 5 },
    { id: '9', x: 7, y: 0, w: 1, h: 3 },
    { id: '10', x: 2, y: 4, w: 1, h: 4 },
    { id: '11', x: 0, y: 0, w: 2, h: 4 },
  ];
  transitions: { name: string; value: string }[] = [
    {
      name: 'ease',
      value: 'transform 500ms ease, width 500ms ease, height 500ms ease',
    },
    {
      name: 'ease-out',
      value:
        'transform 500ms ease-out, width 500ms ease-out, height 500ms ease-out',
    },
    {
      name: 'linear',
      value: 'transform 500ms linear, width 500ms linear, height 500ms linear',
    },
    {
      name: 'overflowing',
      value:
        'transform 500ms cubic-bezier(.28,.49,.79,1.35), width 500ms cubic-bezier(.28,.49,.79,1.35), height 500ms cubic-bezier(.28,.49,.79,1.35)',
    },
    {
      name: 'fast',
      value: 'transform 200ms ease, width 200ms linear, height 200ms linear',
    },
    {
      name: 'slow-motion',
      value:
        'transform 1000ms linear, width 1000ms linear, height 1000ms linear',
    },
    { name: 'transform-only', value: 'transform 500ms ease' },
  ];
  currentTransition: string = this.transitions[0].value;
  currentPlaceholder: string = 'Default';
  dragStartThreshold = 0;
  gap = 0;
  autoScroll = true;
  disableDrag = false;
  disableResize = false;
  disableRemove = false;
  autoResize = true;
  preventCollision = false;
  isDragging = false;
  isResizing = false;
  resizeSubscription: Subscription;

  constructor(
    private ngZone: NgZone,
    public elementRef: ElementRef,
    @Inject(DOCUMENT) public document: Document
  ) {}

  ionViewDidEnter() {
    this.resizeSubscription = merge(
      fromEvent(window, 'resize'),
      fromEvent(window, 'orientationchange')
    ).pipe(
        debounceTime(50),
        filter(() => this.autoResize)
      ).subscribe(() => {
        this.grid.resize();
      });
  }

  ionViewWillLeave() {}

  onDragStarted(event: KtdDragStart) {
    this.isDragging = true;
  }

  onResizeStarted(event: KtdResizeStart) {
    this.isResizing = true;
  }

  onDragEnded(event: KtdDragEnd) {
    this.isDragging = false;
  }

  onResizeEnded(event: KtdResizeEnd) {
    this.isResizing = false;
  }

  onLayoutUpdated(layout: KtdGridLayout) {
    console.log('on layout updated', layout);
    this.layout = layout;
  }

  onCompactTypeChange(change: any) {
    console.log('onCompactTypeChange', change);
    this.compactType = change.value;
  }

  onTransitionChange(change: any) {
    console.log('onTransitionChange', change);
    this.currentTransition = change.value;
  }

  onAutoScrollChange(checked: boolean) {
    this.autoScroll = checked;
  }

  onDisableDragChange(checked: boolean) {
    this.disableDrag = checked;
  }

  onDisableResizeChange(checked: boolean) {
    this.disableResize = checked;
  }

  onDisableRemoveChange(checked: boolean) {
    this.disableRemove = checked;
  }

  onAutoResizeChange(checked: boolean) {
    this.autoResize = checked;
  }

  onPreventCollisionChange(checked: boolean) {
    this.preventCollision = checked;
  }

  onColsChange(event: Event) {
    this.cols = coerceNumberProperty((event.target as HTMLInputElement).value);
  }

  onRowHeightChange(event: Event) {
    this.rowHeight = coerceNumberProperty(
      (event.target as HTMLInputElement).value
    );
  }

  onRowHeightFitChange(change: any) {
    this.rowHeightFit = change.checked;
  }

  onGridHeightChange(event: Event) {
    this.gridHeight = coerceNumberProperty(
      (event.target as HTMLInputElement).value
    );
  }

  onDragStartThresholdChange(event: Event) {
    this.dragStartThreshold = coerceNumberProperty(
      (event.target as HTMLInputElement).value
    );
  }

  onPlaceholderChange(change: any) {
    this.currentPlaceholder = change.value;
  }

  onGapChange(event: Event) {
    this.gap = coerceNumberProperty((event.target as HTMLInputElement).value);
  }

  /**
   * Fired when a mousedown happens on the remove grid item button.
   * Stops the event from propagating an causing the drag to start.
   * We don't want to drag when mousedown is fired on remove icon button.
   */
  public stopEventPropagation(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  /** Removes the item from the layout */
  public removeItem(id: string) {
    // Important: Don't mutate the array. Let Angular know that the layout has changed creating a new reference.
    this.widgets = this.ktdArrayRemoveItem(this.widgets, (item) => item.id === id);
  }

  generateLayout() {
    const layout: KtdGridLayout = [];
    for (let i = 0; i < this.cols; i++) {
      const y = Math.ceil(Math.random() * 4) + 1;
      layout.push({
        x: Math.round(Math.random() * Math.floor(this.cols / 2 - 1)) * 2,
        y: Math.floor(i / 6) * y,
        w: 2,
        h: y,
        id: i.toString(),
      });
    }
    this.layout = ktdGridCompact(layout, this.compactType, this.cols);
    console.log('generateLayout', this.layout);
  }

  public addWidget(type: number) {
    const item = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      id: this.widgets.length.toString(),
      type: type,
      name: 'Widget',
    };
    this.widgets = [...this.widgets, item];
  }

  public isWidgetActive(type: number): boolean {
    return false;
  }

  private ktdArrayRemoveItem<T>(array: T[], condition: (item: T) => boolean) {
    const arrayCopy = [...array];
    const index = array.findIndex((item) => condition(item));
    if (index > -1) {
      arrayCopy.splice(index, 1);
    }
    return arrayCopy;
  }
}
