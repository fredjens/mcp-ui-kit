import React from 'react';
import { styles } from './styles';
import { useResizeToContent } from 'mcp-ui-kit/ui';

interface WeatherData {
  temp: number;
  feelsLike: number;
  condition: string;
  icon: string;
  wind: number;
  humidity: number;
  visibility: number;
  forecast: Array<{
    day: string;
    icon: string;
    temp: number;
  }>;
}

const weatherDataByCity: WeatherData = {
  temp: -2,
  feelsLike: -5,
  condition: 'Partly Cloudy',
  icon: '⛅',
  wind: 12,
  humidity: 65,
  visibility: 10,
  forecast: [
    { day: 'TUE', icon: '🌤️', temp: -1 },
    { day: 'WED', icon: '☁️', temp: 0 },
    { day: 'THU', icon: '🌨️', temp: -3 },
    { day: 'FRI', icon: '❄️', temp: -4 },
    { day: 'SAT', icon: '⛅', temp: -2 }
  ]
};


export function WeatherDashboard() {
  const containerRef = useResizeToContent();
  const data = weatherDataByCity;
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sendToChat = () => {
    const message = `Current weather in Oslo:
Temperature: ${data.temp}°C (feels like ${data.feelsLike}°C)
Condition: ${data.condition}
Wind: ${data.wind} km/h
Humidity: ${data.humidity}%
Visibility: ${data.visibility} km

5-Day Forecast:
${data.forecast.map(day => `${day.day}: ${day.icon} ${day.temp}°C`).join('\n')}`;

    sendPrompt(message);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="container" ref={containerRef}>
        <div className="card">
          <div className="header">
            <h1>
              <span>{data.icon}</span>
              <span>Oslo</span>
            </h1>
            <p className="location">{currentDate}</p>
          </div>

          <div className="current-weather">
            <div className="temp">{data.temp}°C</div>
            <div className="condition">{data.condition}</div>
            <div className="feels-like">Feels like {data.feelsLike}°C</div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">💨</div>
              <div className="stat-label">Wind</div>
              <div className="stat-value">{data.wind} km/h</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">💧</div>
              <div className="stat-label">Humidity</div>
              <div className="stat-value">{data.humidity}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👁️</div>
              <div className="stat-label">Visibility</div>
              <div className="stat-value">{data.visibility} km</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="forecast">
            <div className="forecast-title">5-Day Forecast</div>
            <div className="forecast-grid">
              {data.forecast.map((f, idx) => (
                <div key={idx} className="forecast-item">
                  <div className="forecast-day">{f.day}</div>
                  <div className="forecast-icon">{f.icon}</div>
                  <div className="forecast-temp">{f.temp}°C</div>
                </div>
              ))}
            </div>
          </div>

          <div className="actions">
            <button onClick={sendToChat}>
              💬 Send to Chat
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function sendPrompt(message: string) {
  throw new Error('Function not implemented.');
}

