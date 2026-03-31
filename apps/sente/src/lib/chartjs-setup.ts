/**
 * Chart.js global registration
 * Registers all required Chart.js components for the dashboard
 * @module lib/chartjs-setup
 */

import {
  Chart as ChartJS,
  BubbleController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  BubbleController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export { ChartJS };
