import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, map, Observable, switchMap, take, throwError } from 'rxjs';
import { selectSettingsState } from 'src/app/store';
import { environment } from 'src/environments/environment';
import { SettingsState } from '../../settings/store/settings.store';
import { Weather } from '../models/weather';

@Injectable()
export class WeatherProvider {
  public settingsState$: Observable<SettingsState | null>;

  constructor(
    public http: HttpClient,
    private store: Store<SettingsState>,
  ) {
    this.settingsState$ = this.store.select(selectSettingsState);
  }

  public getForcast(
    lat: number,
    lon: number,
    units: string,
    lang: string,
  ): Observable<Weather> {
    //units: Units of measurement. standard, metric and imperial units are available. If you do not use the units parameter, standard units will be applied by default. https://openweathermap.org/api/one-call-3#data
    //lang: You can use the lang parameter to get the output in your language. https://openweathermap.org/api/one-call-3#multi

    return this.settingsState$
      .pipe(take(1))
      .pipe(
        switchMap((settings) =>
          this.http.get<Weather>(
            `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${settings?.appSettings?.OpenWeatherApiKey}`,
          ),
        ),
      );
  }
}
