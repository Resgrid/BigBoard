import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { UtilsService } from '@resgrid/ngx-resgridlib';
import { Observable } from 'rxjs';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import {
  selectUnitsWidgetSettingsState,
  selectWidgetsState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as WidgetsActions from '../../actions/widgets.actions';
import { UnitsWidgetSettings } from 'src/app/models/unitsWidgetSettings';

@Component({
  selector: 'app-widgets-units',
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.scss'],
})
export class UnitsWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<UnitsWidgetSettings | null>;
  private subs = new SubSink();

  constructor(
    private store: Store<WidgetsState>,
    private utilsProvider: UtilsService,
  ) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(
      selectUnitsWidgetSettingsState,
    );
  }

  ngOnInit(): void {
    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.store.dispatch(new WidgetsActions.GetUnits());
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }

  public getTimeago(date) {
    const timeText = this.utilsProvider.getTimeAgo(date);

    if (timeText.indexOf('seconds') > -1) {
      return '1 minute ago';
    }

    return timeText;
  }

  public getFontSize(settings: UnitsWidgetSettings | null | undefined): number {
    if (settings?.FontSize) {
      return settings.FontSize;
    }

    return 12;
  }
}
