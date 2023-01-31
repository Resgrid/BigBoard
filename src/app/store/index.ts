import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HomeState } from '../features/home/store/home.store';
import { SettingsState } from '../features/settings/store/settings.store';
import * as fromRoot from '../reducers/index';
import * as homeReducers from '../features/home/reducers/home.reducer';
import * as settingsReducers from '../features/settings/reducers/settings.reducer';
import * as voiceReducers from '../features/voice/reducers/voice.reducer';
import * as widgetsReducers from '../features/widgets/reducers/widgets.reducer';
import { VoiceState } from '../features/voice/store/voice.store';
import { WidgetsState } from '../features/widgets/store/widgets.store';

export interface State extends fromRoot.State {
    settings: SettingsState;
    home: HomeState;
    widgets: WidgetsState;
}

export const selectSettingsState = createFeatureSelector<SettingsState>('settingsModule');

export const selectIsLoggedInState = createSelector(
  selectSettingsState,
  settingsReducers.getIsLoggedInState
);

export const selectPerferDarkModeState = createSelector(
  selectSettingsState,
  settingsReducers.getPerferDarkModeState
);

export const selectKeepAliveState = createSelector(
  selectSettingsState,
  settingsReducers.getKeepAliveState
);

export const selectIsAppActive = createSelector(
  selectSettingsState,
  settingsReducers.getIsAppActiveState
);

export const selectHomeState = createFeatureSelector<HomeState>('homeModule');

export const selectHomeWidgetsState = createSelector(
  selectHomeState,
  homeReducers.getWidgets
);


export const selectVoiceState = createFeatureSelector<VoiceState>('voiceModule');

export const selectAvailableChannelsState = createSelector(
  selectVoiceState,
  voiceReducers.getAvailableChannels
);

export const selectWidgetsState = createFeatureSelector<WidgetsState>('widgetsModule');

export const selectWeatherWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getWeatherWidgetSettings
);

export const selectPersonnelWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getPersonnelWidgetSettings
);

export const selectCallsWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getCallsWidgetSettings
);

export const selectUnitsWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getUnitsWidgetSettings
);

export const selectNotesWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getNotesWidgetSettings
);

export const selectMapWidgetSettingsState = createSelector(
  selectWidgetsState,
  widgetsReducers.getMapWidgetSettings
);

export const selectMapWidgetDataState = createSelector(
  selectWidgetsState,
  widgetsReducers.getMapWidgetData
);