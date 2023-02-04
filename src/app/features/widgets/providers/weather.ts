import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Weather } from '../models/weather';

@Injectable()
export class WeatherProvider {
  constructor (public http: HttpClient) {}

    public getForcast(lat: number, lon: number, units: string, lang: string): Observable<Weather> {
        //units: Units of measurement. standard, metric and imperial units are available. If you do not use the units parameter, standard units will be applied by default. https://openweathermap.org/api/one-call-3#data
        //lang: You can use the lang parameter to get the output in your language. https://openweathermap.org/api/one-call-3#multi

        return this.http.get<Weather>(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${environment.weatherApiKey}`);
    };
}
