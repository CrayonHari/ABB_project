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
  selector: 'app-circle-stat',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './circle-stat.component.html',
  styleUrl: './circle-stat.component.css',
})
export class CircleStatComponent {
  chartData: ChartData<'doughnut', { key: string; value: number }[]> = {
    datasets: [
      {
        data: [{ key: '1', value: 1 }],
        backgroundColor: ['#FF6B6B'],
      },
    ],
  };

  chartOptions: ChartOptions<'doughnut'> = {
    circumference: 330,

    plugins: {
      title: {
        display: true,
        text: 'Prediction Confidence',
        font: {
          size: 18,
        },
      },
      tooltip: {
        enabled: false,
      },
      legend: {
        display: false,
      },
    },
  };
}
