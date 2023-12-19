import { Component, OnInit, Input } from '@angular/core';
import {
  CallPriorityResultData,
  CallResultData,
  UtilsService,
} from '@resgrid/ngx-resgridlib';

@Component({
  selector: 'app-widgets-weather-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss'],
})
export class TemperatureComponent implements OnInit {
  @Input() temp: number;
  @Input() unit: number;

  constructor(private utilsProvider: UtilsService) {}

  ngOnInit() {}

  public getTemp(): string {
    return '';
  }

  private kelvinToCelcius(num: number) {
    return Math.round(num - 273.15);
  }

  private celciusToFahrenheit(c: number) {
    return Math.round(c * (9 / 5) + 32);
  }

  private fahrenheitToCelcius(f: number) {
    return Math.round(((f - 32) * 5) / 9);
  }
}
