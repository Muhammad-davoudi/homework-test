/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { ProductAnalytics } from './pages/ProductAnalytics';
import { CustomerSegmentation } from './pages/CustomerSegmentation';
import { AIInsights } from './pages/AIInsights';
import { Recommendations } from './pages/Recommendations';
import { AIAssistant } from './pages/AIAssistant';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<ProductAnalytics />} />
          <Route path="/customers" element={<CustomerSegmentation />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
