import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { PersonnelInfoResultData, UtilsService } from '@resgrid/ngx-resgridlib';
import { map, Observable, Subscription, take } from 'rxjs';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { selectCallsWidgetSettingsState, selectWidgetsState } from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as WidgetsActions from "../../actions/widgets.actions"; 
import { CallsWidgetSettings } from 'src/app/models/callsWidgetSettings';
import { UnitsWidgetSettings } from 'src/app/models/unitsWidgetSettings';

@Component({
  selector: 'app-widgets-calls',
  templateUrl: './calls.component.html',
  styleUrls: ['./calls.component.scss'],
})
export class CallsWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<CallsWidgetSettings | null>;
  private subs = new SubSink();

  constructor(private store: Store<WidgetsState>, private utilsProvider: UtilsService) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(selectCallsWidgetSettingsState);
  }
  
  ngOnInit(): void {
    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.store.dispatch(new WidgetsActions.GetCalls());
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

  public getFontSize(settings: CallsWidgetSettings | null | undefined): number {
    if (settings?.FontSize) {
      return settings.FontSize;
    }

    return 12;
  }
}
