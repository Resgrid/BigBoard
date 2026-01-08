interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherOutlook {
  current: WeatherData;
  forecast: ForecastDay[];
  location: string;
}

export const getWeather = async (apiKey: string, lat: number, lon: number): Promise<WeatherData | null> => {
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`);

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0]?.main || 'Unknown',
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: data.weather[0]?.icon || '01d',
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
};

export const getWeatherOutlook = async (apiKey: string, lat: number, lon: number): Promise<WeatherOutlook | null> => {
  if (!apiKey) {
    return null;
  }

  try {
    // Fetch both current weather and forecast in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error('Weather API request failed');
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process current weather
    const current: WeatherData = {
      temperature: Math.round(currentData.main.temp),
      condition: currentData.weather[0]?.main || 'Unknown',
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed),
      icon: currentData.weather[0]?.icon || '01d',
    };

    // Process forecast - group by day and get daily highs/lows
    const dailyForecasts = new Map<string, any[]>();

    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();

      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, []);
      }
      dailyForecasts.get(dateKey)?.push(item);
    });

    // Convert to forecast days (take next 5 days)
    const forecast: ForecastDay[] = Array.from(dailyForecasts.entries())
      .slice(0, 5)
      .map(([dateKey, items]) => {
        const temps = items.map((i) => i.main.temp);
        const tempHigh = Math.round(Math.max(...temps));
        const tempLow = Math.round(Math.min(...temps));

        // Use midday forecast for conditions (around noon)
        const middayItem = items[Math.floor(items.length / 2)] || items[0];

        const date = new Date(dateKey);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        return {
          date: dateKey,
          dayName,
          tempHigh,
          tempLow,
          condition: middayItem.weather[0]?.main || 'Unknown',
          icon: middayItem.weather[0]?.icon || '01d',
          humidity: middayItem.main.humidity,
          windSpeed: Math.round(middayItem.wind.speed),
        };
      });

    return {
      current,
      forecast,
      location: currentData.name || 'Current Location',
    };
  } catch (error) {
    console.error('Failed to fetch weather outlook:', error);
    return null;
  }
};
