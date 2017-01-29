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
  }

  setWeather() {
    //var iframe = document.getElementById('forecast_embed');
    //if (iframe) {

    if (this.settings.Latitude != 0 && this.settings.Longitude != 0) {
      this.source = window.location.protocol + "//forecast.io/embed/#lat=" + this.settings.Latitude + "&lon=" + this.settings.Longitude + "&units=" + this.settings.Units + "&name="
    } else {
      Geolocation.getCurrentPosition().then((position) => {

        this.source = window.location.protocol + "//forecast.io/embed/#lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&units=" + this.settings.Units + "&name="

      }, (err) => {
        console.log(err);
      });
    }
    //}
  }
}