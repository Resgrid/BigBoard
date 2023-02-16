import { Component, OnInit, Input } from '@angular/core';
import {
  CallPriorityResultData,
  CallResultData,
  UtilsService,
} from '@resgrid/ngx-resgridlib';

@Component({
  selector: 'app-widgets-weather-icon',
  templateUrl: './weather-icon.component.html',
  styleUrls: ['./weather-icon.component.scss'],
})
export class WeatherIconComponent implements OnInit {
  @Input() code: number;

  constructor(private utilsProvider: UtilsService) {}

  ngOnInit() {}

  public getIcon(): string {
    switch (this.code) {
      case 800:
        return 'assets/images/weather/sunny.svg';
        break;

      // Cloud
      case 801:
      case 802:
        return 'assets/images/weather/partly-cloudy.svg';
        break;
      case 803:
      case 804:
        return 'assets/images/weather/cloudy.svg';
        break;

      // Rain
      case 500:
      case 501:
      case 520:
      case 521:
      case 511:
        return 'assets/images/weather/rain.svg';
        break;
      case 502:
      case 503:
      case 504:
      case 522:
      case 531:
        return 'assets/images/weather/heavy-rain.svg';
        break;

      // Drizzle
      case 300:
      case 301:
      case 302:
      case 310:
      case 311:
      case 312:
      case 313:
      case 314:
      case 321:
        return 'assets/images/weather/rain.svg';
        break;

      // Thunderstorm
      case 200:
      case 201:
      case 202:
      case 210:
      case 211:
      case 212:
      case 221:
      case 230:
      case 231:
      case 232:
        return 'assets/images/weather/thunderstorm.svg';
        break;

      // Snow
      case 600:
      case 601:
      case 602:
      case 612:
      case 613:
      case 615:
      case 616:
      case 620:
      case 621:
      case 622:
        return 'assets/images/weather/snow.svg';
        break;
      case 611:
        return 'assets/images/weather/sleet.svg';
        break;

      // Atmosphere
      case 701:
      case 711:
      case 721:
      case 731:
      case 741:
      case 751:
      case 761:
      case 762:
      case 771:
      case 781:
        return 'assets/images/weather/haze.svg';
        break;

      default:
        return 'assets/images/weather/sunny.svg';
    }
  }
}
