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
  selector: 'app-bar-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css',
})
export class BarChartComponent {
  chartData: ChartData<'bar', { key: string; value: number }[]> = {
    datasets: [
      {
        data: [
          { key: 'Jan', value: 66 },
          { key: 'Feb', value: 48 },
          { key: 'Mar', value: 73 },
          { key: 'Apr', value: 53 },
          { key: 'May', value: 62 },
          { key: 'Jun', value: 79 },
          { key: 'Jul', value: 41 },
          { key: 'Aug', value: 69 },
          { key: 'Sep', value: 47 },
          { key: 'Oct', value: 55 },
          { key: 'Nov', value: 78 },
          { key: 'Dec', value: 44 },
        ],
        parsing: {
          xAxisKey: 'key',
          yAxisKey: 'value',
        },
        backgroundColor: ['#756', '#845', '#938'],
      },
    ],
  };

  chartOptions: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: 'Selected Date Ranges Summary',
        font: {
          size: 20,
        },
      },
      legend: {
        display: false,
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Timeline (2021)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Volume',
        },
      },
    },
  };
}
