// Mock data generator (would be real API calls in production)
export function generateMockStockData(symbols: string[]) {
    const stockInfo: Record<string, { name: string; basePrice: number }> = {
        'AAPL': { name: 'Apple Inc.', basePrice: 178 },
        'GOOGL': { name: 'Alphabet Inc.', basePrice: 141 },
        'MSFT': { name: 'Microsoft Corp.', basePrice: 378 },
        'AMZN': { name: 'Amazon.com Inc.', basePrice: 178 },
        'NVDA': { name: 'NVIDIA Corp.', basePrice: 875 },
        'META': { name: 'Meta Platforms Inc.', basePrice: 505 },
        'TSLA': { name: 'Tesla Inc.', basePrice: 248 },
    };

    return symbols.map(symbol => {
        const info = stockInfo[symbol] || { name: `${symbol} Corp.`, basePrice: 100 };
        const change = (Math.random() - 0.5) * 10;
        const price = info.basePrice + change;

        return {
            symbol,
            name: info.name,
            price: Math.round(price * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round((change / info.basePrice) * 10000) / 100,
            volume: `${Math.floor(Math.random() * 50 + 10)}M`,
            marketCap: `${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 100)}T`,
            dayHigh: Math.round((price + Math.random() * 5) * 100) / 100,
            dayLow: Math.round((price - Math.random() * 5) * 100) / 100,
            history: Array.from({ length: 10 }, (_, i) => ({
                date: `Day ${i + 1}`,
                price: Math.round((info.basePrice + (Math.random() - 0.5) * 20) * 100) / 100,
            })),
        };
    });
}