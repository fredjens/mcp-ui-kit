import React, { useState, useEffect } from 'react';
import { generateMockStockData } from './stock-utils';
import { callTool, sendPrompt, useProps, useResizeToContent } from 'mcp-ui-kit/ui';


// Types for props passed from the tool handler
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  dayHigh: number;
  dayLow: number;
  history: Array<{ date: string; price: number }>;
}

interface PortfolioProps {
  symbols: string[];
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
}



export function StockDashboard() {
  // These props come from the tool's inputSchema parameters
  const props = useProps<PortfolioProps>({
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    timeframe: '1M',
  });

  // Auto-notify parent when content size changes
  const containerRef = useResizeToContent();

  const stocks: StockData[] = generateMockStockData(props.symbols);

  const [selectedStock, setSelectedStock] = useState<string>(stocks[0]?.symbol || '');

  // Reset selection when symbols change (e.g., after refresh with new params)
  useEffect(() => {
    setSelectedStock(stocks[0]?.symbol || '');
  }, [props.symbols.join(',')]);

  const selected = stocks.find(s => s.symbol === selectedStock) || stocks[0];

  const totalValue = stocks.reduce((sum, s) => sum + s.price * 100, 0); // Assuming 100 shares each
  const totalChange = stocks.reduce((sum, s) => sum + s.change * 100, 0);

  const sendAnalysis = () => {
    const analysis = `Portfolio Analysis Request:

Symbols: ${props.symbols.join(', ')}
Timeframe: ${props.timeframe}

Current Holdings:
${stocks.map(s => `- ${s.symbol} (${s.name}): $${s.price.toFixed(2)} (${s.change >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join('\n')}

Total Portfolio Value: $${totalValue.toLocaleString()}
Today's Change: ${totalChange >= 0 ? '+' : ''}$${totalChange.toFixed(2)}

Please analyze this portfolio and provide recommendations.`;

    sendPrompt(analysis);
  };

  const requestRefresh = () => {
    // This would call a tool to refresh the data
    callTool('stock_portfolio');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard" ref={containerRef}>
        {/* Header */}
        <div className="header">
          <div>
            <h1>📈 Stock Portfolio</h1>
            <p className="subtitle">Timeframe: {props.timeframe} • {stocks.length} stocks</p>
          </div>
          <div className="portfolio-summary">
            <div className="total-value">${totalValue.toLocaleString()}</div>
            <div className={`total-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
              {totalChange >= 0 ? '▲' : '▼'} ${Math.abs(totalChange).toFixed(2)} today
            </div>
          </div>
        </div>

        {/* Stock Selector Tabs */}
        <div className="stock-tabs">
          {stocks.map(stock => (
            <button
              key={stock.symbol}
              className={`stock-tab ${selectedStock === stock.symbol ? 'active' : ''}`}
              onClick={() => setSelectedStock(stock.symbol)}
            >
              <span className="tab-symbol">{stock.symbol}</span>
              <span className={`tab-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </button>
          ))}
        </div>

        {/* Selected Stock Detail */}
        {selected && (
          <div className="stock-detail">
            <div className="detail-header">
              <div>
                <h2>{selected.symbol}</h2>
                <p className="company-name">{selected.name}</p>
              </div>
              <div className="price-section">
                <div className="current-price">${selected.price.toFixed(2)}</div>
                <div className={`price-change ${selected.change >= 0 ? 'positive' : 'negative'}`}>
                  {selected.change >= 0 ? '+' : ''}{selected.change.toFixed(2)} ({selected.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            <div className="chart-section">
              <Sparkline
                data={selected.history.map(h => h.price)}
                color={selected.change >= 0 ? '#10b981' : '#ef4444'}
              />
            </div>

            <div className="stats-grid">
              <div className="stat">
                <span className="stat-label">Day High</span>
                <span className="stat-value">${selected.dayHigh.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Day Low</span>
                <span className="stat-value">${selected.dayLow.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Volume</span>
                <span className="stat-value">{selected.volume}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Market Cap</span>
                <span className="stat-value">{selected.marketCap}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <button className="btn-secondary" onClick={requestRefresh}>
            🔄 Refresh Data
          </button>
          <button className="btn-primary" onClick={sendAnalysis}>
            💬 Request Analysis
          </button>
        </div>
      </div>
    </>
  );
}

// Simple sparkline chart component
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 120;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
  }
  
  .dashboard {
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #334155;
  }
  
  h1 {
    font-size: 24px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .subtitle {
    color: #64748b;
    font-size: 14px;
    margin-top: 4px;
  }
  
  .portfolio-summary {
    text-align: right;
  }
  
  .total-value {
    font-size: 28px;
    font-weight: 700;
    color: #f8fafc;
  }
  
  .total-change {
    font-size: 14px;
    margin-top: 4px;
  }
  
  .positive { color: #10b981; }
  .negative { color: #ef4444; }
  
  .stock-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .stock-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 20px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 100px;
  }
  
  .stock-tab:hover {
    background: #334155;
  }
  
  .stock-tab.active {
    background: #3b82f6;
    border-color: #3b82f6;
  }
  
  .tab-symbol {
    font-weight: 600;
    font-size: 16px;
    color: #f8fafc;
  }
  
  .tab-change {
    font-size: 12px;
    margin-top: 4px;
  }
  
  .stock-detail {
    background: #1e293b;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 20px;
  }
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 32px;
    font-weight: 700;
    color: #f8fafc;
  }
  
  .company-name {
    color: #64748b;
    font-size: 14px;
    margin-top: 4px;
  }
  
  .price-section {
    text-align: right;
  }
  
  .current-price {
    font-size: 32px;
    font-weight: 700;
    color: #f8fafc;
  }
  
  .price-change {
    font-size: 16px;
    margin-top: 4px;
  }
  
  .chart-section {
    background: #0f172a;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  
  .stat {
    background: #0f172a;
    padding: 16px;
    border-radius: 12px;
    text-align: center;
  }
  
  .stat-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .actions {
    display: flex;
    gap: 12px;
  }
  
  button {
    flex: 1;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  }
  
  .btn-secondary {
    background: #334155;
    color: #e2e8f0;
  }
  
  .btn-secondary:hover {
    background: #475569;
  }
`;

