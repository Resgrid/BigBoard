import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { PersonnelInfoResultData, UtilsService } from '@resgrid/ngx-resgridlib';
import { map, Observable, Subscription, take } from 'rxjs';
import { PersonnelWidgetSettings } from 'src/app/models/personnelWidgetSettings';
import {
  selectNotesWidgetSettingsState,
  selectWidgetsState,
} from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import * as WidgetsActions from '../../actions/widgets.actions';
import { NotesWidgetSettings } from 'src/app/models/notesWidgetSettings';

@Component({
  selector: 'app-widgets-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
})
export class NotesWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<NotesWidgetSettings | null>;
  private subs = new SubSink();

  constructor(
    private store: Store<WidgetsState>,
    private utilsProvider: UtilsService,
  ) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(
      selectNotesWidgetSettingsState,
    );
  }

  ngOnInit(): void {
    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.store.dispatch(new WidgetsActions.GetNotes());
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
      this.subs.unsubscribe();
    }
  }
}
