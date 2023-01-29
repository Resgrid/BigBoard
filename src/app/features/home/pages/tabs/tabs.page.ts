import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { UtilsService } from '@resgrid/ngx-resgridlib';
import { Observable } from 'rxjs';
import { SettingsState } from 'src/app/features/settings/store/settings.store';
import { VoiceState } from 'src/app/features/voice/store/voice.store';
import { selectHomeState, selectSettingsState, selectVoiceState } from 'src/app/store';
import { HomeState } from '../../store/home.store';

@Component({
  selector: 'app-home-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  public settingsState$: Observable<SettingsState | null>;
  public homeState$: Observable<HomeState | null>;
  
  constructor(private store: Store<SettingsState>, private homeStore: Store<HomeState>, private utilsProvider: UtilsService) {
    this.settingsState$ = this.store.select(selectSettingsState);
    this.homeState$ = this.homeStore.select(selectHomeState);
  }

  public getDate(date) {
		return this.utilsProvider.getDate(date);
	}
}
