import React from 'react';
import { createRoot } from 'react-dom/client';
import { StockDashboard } from './StockDashboard';

const rootElement = document.getElementById('root') || document.body;
const root = createRoot(rootElement);
root.render(<StockDashboard />);



