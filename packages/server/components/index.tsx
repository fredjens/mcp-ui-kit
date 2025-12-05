import React from 'react';
import { createRoot } from 'react-dom/client';
import { WeatherDashboard } from './WeatherDashboard';

// This is the entry point that will be bundled
// The 'root' element is provided by the remoteDom host
const rootElement = document.getElementById('root') || document.body;
const root = createRoot(rootElement);
root.render(<WeatherDashboard />);

