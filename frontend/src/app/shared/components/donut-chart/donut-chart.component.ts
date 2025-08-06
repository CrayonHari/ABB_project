import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import {
  Chart as ChartJS,
  // Controllers
  LineController,
  BarController,
  DoughnutController,
  PieController,
  RadarController,
  PolarAreaController,

  // Elements
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,

  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,

  // Plugins
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  // Controllers
  LineController,
  BarController,
  DoughnutController,
  PieController,
  RadarController,
  PolarAreaController,

  // Elements
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,

  // Scales
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,

  // Plugins
  Tooltip,
  Legend,
  Title
);

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css',
})
export class DonutChartComponent {
  chartData: ChartData<'doughnut', { key: string; value: number }[]> = {
    labels: [
      'True Positive',
      'True Negative',
      'False Positive',
      'False Negative',
    ],
    datasets: [
      {
        data: [
          { key: 'True Positive', value: 69 },
          { key: 'True Negative', value: 16 },
          { key: 'False Positive', value: 4 },
          { key: 'False Negative', value: 2 },
        ],

        backgroundColor: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
        hoverOffset: 4,
      },
    ],
  };

  chartOptions: ChartOptions<'doughnut'> = {
    plugins: {
      title: {
        display: true,
        text: 'Model Performance',
        font: {
          size: 18,
        },
      },
      legend: {
        display: true,

        position: 'right',
      },
    },
  };
}
