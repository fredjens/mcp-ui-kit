export const styles = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 16px;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
  }
  .card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    margin-bottom: 16px;
  }
  .header {
    text-align: center;
    margin-bottom: 24px;
  }
  h1 { 
    margin: 0 0 8px 0; 
    color: #667eea;
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .location {
    color: #64748b;
    font-size: 18px;
    margin: 0;
  }
  .current-weather {
    text-align: center;
    padding: 32px 0;
    border-bottom: 2px solid #f1f5f9;
  }
  .temp {
    font-size: 72px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  .condition {
    font-size: 24px;
    color: #64748b;
    margin: 8px 0;
  }
  .feels-like {
    font-size: 14px;
    color: #94a3b8;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 24px;
  }
  .stat-item {
    text-align: center;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
  }
  .stat-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  .stat-label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin-top: 4px;
  }
  .forecast {
    margin-top: 16px;
  }
  .forecast-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }
  .forecast-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }
  .forecast-item {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px 8px;
    text-align: center;
  }
  .forecast-day {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .forecast-icon {
    font-size: 32px;
    margin: 8px 0;
  }
  .forecast-temp {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
  .actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
  button {
    flex: 1;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  button:hover { 
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  button:active { transform: translateY(0); }
  .city-selector {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 16px;
  }
  .city-btn {
    padding: 8px 16px;
    font-size: 12px;
    background: #f1f5f9;
    color: #475569;
  }
  .city-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
`;