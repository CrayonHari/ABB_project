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
  Filler,
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
  Filler,
  Title
);
@Component({
  selector: 'app-line-chart-filled',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './line-chart-filled.component.html',
  styleUrl: './line-chart-filled.component.css',
})
export class LineChartFilledComponent {
  chartData: ChartData<'line', { key: string; value: number }[]> = {
    datasets: [
      {
        label: 'Quality Score',
        data: [
          { key: '1', value: 0.35 },
          { key: '2', value: 1.12 },
          { key: '3', value: 0.78 },
          { key: '4', value: 1.01 },
          { key: '5', value: 0.66 },
          { key: '6', value: 0.14 },
          { key: '7', value: 0.93 },
          { key: '8', value: 0.49 },
          { key: '9', value: 0.81 },
          { key: '10', value: 1.18 },
        ],
        parsing: {
          xAxisKey: 'key',
          yAxisKey: 'value',
        },

        borderColor: '#ff6384',
        backgroundColor: '#ff63852c',
        fill: true,
      },
    ],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Real-Time Quality Predictions',
        font: {
          size: 20,
        },
      },
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Quality Score',
        },
      },
    },
  };
}
