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
import {
  debounceTime,
  filter,
  fromEvent,
  map,
  merge,
  Observable,
  Subscription,
  take,
} from 'rxjs';
import { Widget } from 'src/app/models/widget';
import { HomeProvider } from '../../providers/home';
import * as _ from 'lodash';
import { HomeState } from '../../store/home.store';
import { Store } from '@ngrx/store';
import { selectHomeWidgetsState } from 'src/app/store';
import * as HomeActions from '../../actions/home.actions';
import { SubSink } from 'subsink';
import { UtilsService } from '@resgrid/ngx-resgridlib';

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
  private subs = new SubSink();

  public widgetsState$: Observable<Widget[]>;
  public widgets: Widget[] = [];

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
    @Inject(DOCUMENT) public document: Document,
    private homeProvider: HomeProvider,
    private store: Store<HomeState>,
    private utilsService: UtilsService
  ) {
    this.widgetsState$ = this.store.select(selectHomeWidgetsState);
  }

  ionViewDidEnter() {
    this.resizeSubscription = merge(
      fromEvent(window, 'resize'),
      fromEvent(window, 'orientationchange')
    )
      .pipe(
        debounceTime(50),
        filter(() => this.autoResize)
      )
      .subscribe(() => {
        this.grid.resize();
      });

    this.subs.sink = this.widgetsState$.subscribe((widgets) => {
      if (widgets) {
        this.widgets = _.cloneDeep(widgets);
      }
    });

    this.homeProvider.startSignalR();
    this.store.dispatch(new HomeActions.LoadWidgetLayout());
  }

  ionViewWillLeave() {
    this.homeProvider.stopSignalR();

    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

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
    this.store.dispatch(new HomeActions.WidgetLayoutUpdated(layout));
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
    this.store.dispatch(new HomeActions.RemoveWidget(id));
  }

  public addWidget(type: number) {
    switch (type) {
      case 1: // Personnel
        const personnelWdiget = {
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Personnel',
        };
        this.store.dispatch(new HomeActions.AddWidget(personnelWdiget));
        break;
      case 2: // Map
        const mapWdiget = {
          x: 0,
          y: 0,
          w: 4,
          h: 6,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Map',
        };
        this.store.dispatch(new HomeActions.AddWidget(mapWdiget));
        break;
      case 3: // Weather
        const weatherWdiget = {
          x: 0,
          y: 0,
          w: 7,
          h: 4,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Weather',
        };
        this.store.dispatch(new HomeActions.AddWidget(weatherWdiget));
        break;
      case 4: // Units
        const unitsWidget = {
          x: 0,
          y: 0,
          w: 5,
          h: 3,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Units',
        };
        this.store.dispatch(new HomeActions.AddWidget(unitsWidget));
        break;
      case 5: // Calls
        const callsWidget = {
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Calls',
        };
        this.store.dispatch(new HomeActions.AddWidget(callsWidget));
        break;
      case 8: // Notes
        const notesWidget = {
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Notes',
        };
        this.store.dispatch(new HomeActions.AddWidget(notesWidget));
        break;
      case 9: // PTT
        const pttWidget = {
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'PTT',
        };
        this.store.dispatch(new HomeActions.AddWidget(pttWidget));
        break;
      case 10: // Clock
        const clockWidget = {
          x: 0,
          y: 0,
          w: 3,
          h: 3,
          id: this.utilsService.generateUUID(),
          type: type,
          name: 'Clock',
        };
        this.store.dispatch(new HomeActions.AddWidget(clockWidget));
        break;
    }
  }

  public isWidgetActive(type: number): Observable<boolean> {
    return this.widgetsState$.pipe(take(1)).pipe(
      map((widgets) => {
        const widget = _.find(widgets, { type: type });

        if (widget) {
          return true;
        }

        return false;
      })
    );
  }
}
