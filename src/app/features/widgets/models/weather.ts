export interface Weather {
    lat:             number;
    lon:             number;
    timezone:        string;
    timezone_offset: number;
    current:         Current;
    minutely:        Minutely[];
    hourly:          Current[];
    daily:           Daily[];
}

export interface Current {
    dt:         number;
    sunrise?:   number;
    sunset?:    number;
    temp:       number;
    feels_like: number;
    pressure:   number;
    humidity:   number;
    dew_point:  number;
    uvi:        number;
    clouds:     number;
    visibility: number;
    wind_speed: number;
    wind_deg:   number;
    weather:    WeatherInfo[];
    wind_gust?: number;
    pop?:       number;
}

export interface WeatherInfo {
    id:          number;
    main:        string;
    description: string;
    icon:        string;
}

export interface Daily {
    day_name:   string;
    dt:         number;
    sunrise:    number;
    sunset:     number;
    moonrise:   number;
    moonset:    number;
    moon_phase: number;
    temp:       Temp;
    feels_like: FeelsLike;
    pressure:   number;
    humidity:   number;
    dew_point:  number;
    wind_speed: number;
    wind_deg:   number;
    wind_gust:  number;
    weather:    WeatherInfo[];
    clouds:     number;
    pop:        number;
    uvi:        number;
    rain?:      number;
}

export interface FeelsLike {
    day:   number;
    night: number;
    eve:   number;
    morn:  number;
}

export interface Temp {
    day:   number;
    min:   number;
    max:   number;
    night: number;
    eve:   number;
    morn:  number;
}

export interface Minutely {
    dt:            number;
    precipitation: number;
}