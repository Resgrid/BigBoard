import { Component } from '@angular/core';

import { WeatherWidgetSettings } from '../../models/weatherWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { Geolocation } from 'ionic-native';

@Component({
  selector: 'weather-widget',
  templateUrl: 'weather-widget.html'
})
export class WeatherWidget {
  public settings: WeatherWidgetSettings;
  public source: string = "";
  private settingsUpdatedSubscription: any;
  private intervalId;

  constructor(private dataProvider: DataProvider,
    private widgetPubSub: WidgetPubSub) {
    this.settings = new WeatherWidgetSettings();
    this.setWeather();
  }

  ngOnInit() {
    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.WEATHER_SETTINGS) {
        this.settings = e.data;
        this.setWeather();
      }
    });

    this.intervalId = setInterval(() => {
      this.setWeather();
    }, 3600000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  setWeather() {
    if (this.settings.Latitude != 0 && this.settings.Longitude != 0) {
      this.source = "https://forecast.io/embed/#lat=" + this.settings.Latitude + "&lon=" + this.settings.Longitude + "&units=" + this.settings.Units + "&name="
    } else {
      Geolocation.getCurrentPosition().then((position) => {

        this.source = "https://forecast.io/embed/#lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=" + this.settings.Units + "&name="

      }, (err) => {
        console.log(err);
      });
    }
    //}
  }
}