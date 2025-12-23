interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
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
