import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { VoiceState } from 'src/app/features/voice/store/voice.store';
import { PTTWidgetSettings } from 'src/app/models/pttWidgetSettings';
import { selectPTTWidgetSettingsState, selectSettingsState, selectVoiceState, selectWidgetsState } from 'src/app/store';
import { SubSink } from 'subsink';
import * as VoiceActions from '../../../voice/actions/voice.actions';
import { WidgetsState } from '../../store/widgets.store';
import * as _ from 'lodash';
import { SettingsState } from 'src/app/features/settings/store/settings.store';

@Component({
  selector: 'app-widgets-ptt',
  templateUrl: './ptt.component.html',
  styleUrls: ['./ptt.component.scss'],
})
export class PTTWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public voiceState$: Observable<VoiceState>;
  public widgetSettingsState$: Observable<PTTWidgetSettings | null>;
  public settingsState$: Observable<SettingsState>;
  private subs = new SubSink();
  
  constructor(private voiceStore: Store<VoiceState>, private widgetStore: Store<WidgetsState>, private settingsStore: Store<SettingsState>) {
    this.voiceState$ = this.voiceStore.select(selectVoiceState);
    this.widgetsState$ = this.widgetStore.select(selectWidgetsState);
    this.settingsState$ = this.settingsStore.select(selectSettingsState);
    this.widgetSettingsState$ = this.widgetStore.select(selectPTTWidgetSettingsState);
  }
  
  ngOnInit(): void {

    this.subs.sink = this.settingsState$.subscribe((settingsStore) => {
      if (settingsStore && settingsStore.appSettings) {
        this.voiceState$.pipe(take(1)).subscribe((state) => {
          if (state && !state.currentActiveVoipChannel) {
            this.widgetSettingsState$.pipe(take(1)).subscribe((settings) => {
              if (settings && settings.Channel) {
                const channel = _.find(state.channels, { Name: settings.Channel });
    
                if (channel) {
                  this.voiceStore.dispatch(new VoiceActions.SetActiveChannel(channel));
                }
              }
            });
          }
        });
      }
    });

    this.voiceStore.dispatch(new VoiceActions.GetVoipInfo());
  }

  ngOnDestroy(): void {
    this.voiceStore.dispatch(new VoiceActions.SetNoChannel());

    if (this.subs) {
			this.subs.unsubscribe();
		}
  }

}
