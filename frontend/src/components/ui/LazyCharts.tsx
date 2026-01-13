/**
 * Lazy Chart Components
 * Proxy pattern for heavy Recharts library (~300KB)
 * Only loads when charts are actually rendered
 */

import { lazy, Suspense } from 'react';
import { ContentLoader } from './SuspenseFallback';

// Lazy-load entire recharts library - simpler approach without type complications
const LazyAreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart as any })));
const LazyArea = lazy(() => import('recharts').then(m => ({ default: m.Area as any })));
const LazyBarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart as any })));
const LazyBar = lazy(() => import('recharts').then(m => ({ default: m.Bar as any })));
const LazyLineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart as any })));
const LazyLine = lazy(() => import('recharts').then(m => ({ default: m.Line as any })));
const LazyPieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart as any })));
const LazyPie = lazy(() => import('recharts').then(m => ({ default: m.Pie as any })));
const LazyXAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis as any })));
const LazyYAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis as any })));
const LazyCartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid as any })));
const LazyTooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip as any })));
const LazyResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer as any })));
const LazyCell = lazy(() => import('recharts').then(m => ({ default: m.Cell as any })));
const LazyLegend = lazy(() => import('recharts').then(m => ({ default: m.Legend as any })));

/**
 * Wrapper function to create Suspense-wrapped chart components
 */
function withSuspense(Component: any, displayName: string): any {
  const WrappedComponent = (props: any) => (
    <Suspense fallback={<ContentLoader />}>
      <Component {...props} />
    </Suspense>
  );
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
}

// Export Suspense-wrapped components
export const AreaChart = withSuspense(LazyAreaChart, 'LazyAreaChart');
export const Area = withSuspense(LazyArea, 'LazyArea');
export const BarChart = withSuspense(LazyBarChart, 'LazyBarChart');
export const Bar = withSuspense(LazyBar, 'LazyBar');
export const LineChart = withSuspense(LazyLineChart, 'LazyLineChart');
export const Line = withSuspense(LazyLine, 'LazyLine');
export const PieChart = withSuspense(LazyPieChart, 'LazyPieChart');
export const Pie = withSuspense(LazyPie, 'LazyPie');
export const XAxis = withSuspense(LazyXAxis, 'LazyXAxis');
export const YAxis = withSuspense(LazyYAxis, 'LazyYAxis');
export const CartesianGrid = withSuspense(LazyCartesianGrid, 'LazyCartesianGrid');
export const Tooltip = withSuspense(LazyTooltip, 'LazyTooltip');
export const ResponsiveContainer = withSuspense(LazyResponsiveContainer, 'LazyResponsiveContainer');
export const Cell = withSuspense(LazyCell, 'LazyCell');
export const Legend = withSuspense(LazyLegend, 'LazyLegend');

/**
 * Usage:
 * import { AreaChart, Area, XAxis, YAxis } from '@/components/ui/LazyCharts';
 * 
 * // Components automatically lazy-load recharts on first render
 */
