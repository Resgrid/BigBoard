import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { PersonnelInfoResultData, UtilsService } from '@resgrid/ngx-resgridlib';
import { map, Observable, Subscription, take } from 'rxjs';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import { selectPersonnelWidgetSettingsState, selectWidgetsState } from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as WidgetsActions from "../../actions/widgets.actions"; 

@Component({
  selector: 'app-widgets-personnel',
  templateUrl: './personnel.component.html',
  styleUrls: ['./personnel.component.scss'],
})
export class PersonnelWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<PersonnelWidgetSettings | null>;
  private subs = new SubSink();

  constructor(private store: Store<WidgetsState>, private utilsProvider: UtilsService) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(selectPersonnelWidgetSettingsState);
  }

  ngOnInit(): void {
    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.store.dispatch(new WidgetsActions.GetPersonnelStatuses());
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
			this.subs.unsubscribe();
		}
  }

  public isPersonOrGroupHidden(status: PersonnelInfoResultData): Observable<boolean> {
    return this.widgetsState$.pipe(take(1)).pipe(map(state => 
      {
        if (state) {
          let index = state.personnelWidgetGroupHides.indexOf(parseInt(status.GroupId), 0);
  
          if (index > -1) {
            return true;
          }
  
          if (state.personnelWidgetSettings?.HideNotResponding) {
            let notRespondingText: string;
  
            if (state.personnelWidgetSettings?.NotRespondingText) {
              notRespondingText = state.personnelWidgetSettings?.NotRespondingText;
            } else {
              notRespondingText = 'Not Responding';
            }
  
            if (status.Status == notRespondingText) {
              return true;
            }
          }
  
          if (state.personnelWidgetSettings?.HideUnavailable) {
            let unavailableText: string;
  
            if (state.personnelWidgetSettings?.UnavailableText) {
              unavailableText = state.personnelWidgetSettings?.UnavailableText;
            } else {
              unavailableText = 'Unavailable';
            }
  
            if (status.Staffing == unavailableText) {
              return true;
            }
          }
        }
        return false;
      }));
  }

  public getTimeago(date) {
		return this.utilsProvider.getTimeAgo(date);
	}

  public getFontSize(settings: PersonnelWidgetSettings | null | undefined): number {
    if (settings?.FontSize) {
      return settings.FontSize;
    }

    return 12;
  }
}
