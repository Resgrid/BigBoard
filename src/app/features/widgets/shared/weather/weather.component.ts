import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { WeatherWidgetSettings } from 'src/app/models/weatherWidgetSettings';
import { selectWeatherWidgetSettingsState, selectWidgetsState } from 'src/app/store';
import { SubSink } from 'subsink';
import { WidgetsState } from '../../store/widgets.store';
import { Geolocation } from '@capacitor/geolocation';

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
    this.subs.sink = this.widgetSettingsState$.subscribe((settings) => {
      this.setWeather();
    });

    this.intervalId = setInterval(() => {
      this.setWeather();
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

  private setWeather() {
    this.widgetsState$.pipe(take(1)).subscribe((state) => {
      if (state && state.weatherWidgetSettings) {
        if (state.weatherWidgetSettings.Latitude != 0 && state.weatherWidgetSettings.Longitude != 0) {
          this.source = "https://forecast.io/embed/#lat=" + state.weatherWidgetSettings.Latitude + "&lon=" + state.weatherWidgetSettings.Longitude + "&units=" + state.weatherWidgetSettings.Units + "&name="
        } else {
          Geolocation.getCurrentPosition().then((position) => {
            if (position && position.coords) {
              this.source = "https://forecast.io/embed/#lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=" + state.weatherWidgetSettings!.Units + "&name="
            }
          }, (err) => {
            console.log(err);
          });
        }
      }
    });
  }
}
