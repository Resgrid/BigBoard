import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { CallPriorityResultData, CallResultData, GpsLocation, UtilsService } from '@resgrid/ngx-resgridlib';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { Weather } from '../../models/weather';
import { WeatherProvider } from '../../providers/weather';
import { WidgetsState } from '../../store/widgets.store';
import { selectWeatherWidgetLocationState } from 'src/app/store';

@Component({
  selector: 'app-widgets-forcast',
  templateUrl: './forcast.component.html',
  styleUrls: ['./forcast.component.scss'],
})
export class ForcastComponent implements OnInit, OnDestroy {
  @Input() units: string;
  @Input() lang: string;

  public location: GpsLocation | null;
  public forcast: Weather;
  private subs = new SubSink();
  public widgetWeatherLocationState$: Observable<GpsLocation | null>;

  constructor(private weatherProvider: WeatherProvider, private store: Store<WidgetsState>) {
    this.widgetWeatherLocationState$ = this.store.select(selectWeatherWidgetLocationState);
  }

  ngOnInit() {
    this.subs.sink = this.widgetWeatherLocationState$.subscribe((location) => {
      if (location) {
        this.location = location;
        this.fetch();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subs) {
			this.subs.unsubscribe();
		}
  }

  private fetch() {
    if (this.location) {
      this.weatherProvider.getForcast(this.location.Latitude, this.location.Longitude, this.units, this.lang).subscribe((data: Weather) => {

        if (data) {
          for (let i = 0; i < data.daily.length; i++) {
            const date = new Date(data.daily[i].dt * 1000);
            data.daily[i].day_name = date.toLocaleString('en-us', {  weekday: 'short' });
          }

          this.forcast = data;
        }
      });
    }
  }
}
