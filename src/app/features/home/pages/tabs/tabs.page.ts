import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SettingsState } from 'src/app/features/settings/store/settings.store';
import { VoiceState } from 'src/app/features/voice/store/voice.store';
import { selectSettingsState, selectVoiceState } from 'src/app/store';

@Component({
  selector: 'app-home-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public settingsState$: Observable<SettingsState | null>;
  public voiceState$: Observable<VoiceState | null>;
  
  constructor(private store: Store<SettingsState>, private voiceStore: Store<VoiceState>,) {
    this.settingsState$ = this.store.select(selectSettingsState);
    this.voiceState$ = this.voiceStore.select(selectVoiceState);
  }
}
