import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { selectWeatherWidgetSettingsState, selectWidgetsState } from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { GpsLocation } from '@resgrid/ngx-resgridlib';
import * as WidgetsActions from "../../actions/widgets.actions"; 

@Component({
  selector: 'app-widgets-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.scss'],
})
export class WeatherWidgetComponent implements OnInit, OnDestroy {
  public widgetsState$: Observable<WidgetsState>;
  public widgetSettingsState$: Observable<WeatherWidgetSettings | null>;
  public source: string = "";
  private subs = new SubSink();
  private intervalId;

  constructor(private store: Store<WidgetsState>) {
    this.widgetsState$ = this.store.select(selectWidgetsState);
    this.widgetSettingsState$ = this.store.select(selectWeatherWidgetSettingsState);
  }
  
  ngOnInit(): void {
    this.getLocation();

    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      //this.setWeather();
    });

    this.intervalId = setInterval(() => {
      //this.setWeather();
    }, 3600000);
  }

  ngOnDestroy(): void {
    if (this.subs) {
			this.subs.unsubscribe();
		}

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public getLocation() {
    this.widgetsState$.pipe(take(1)).subscribe((state) => {
      if (state && state.weatherWidgetSettings) {
        if (state.weatherWidgetSettings.Latitude != 0 && state.weatherWidgetSettings.Longitude != 0) {
          this.store.dispatch(new WidgetsActions.SetWeatherLocation(new GpsLocation(state.weatherWidgetSettings.Latitude, state.weatherWidgetSettings.Longitude)));
        } else {
          Geolocation.getCurrentPosition().then((position) => {
            if (position && position.coords) {
              this.store.dispatch(new WidgetsActions.SetWeatherLocation(new GpsLocation(position.coords.latitude, position.coords.longitude)));
            }
          }, (err) => {
            console.log(err);
          });
        }
      }
    });
  }

  public getUnits() {
    return 'imperial';
  }

  public getLang() {
    return 'en';
  }
}
