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
  selector: 'app-line-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.css',
})
export class LineChartComponent {
  chartData: ChartData<'line', { key: string; value: number }[]> = {
    datasets: [
      {
        label: 'Training Accuracy',
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
        backgroundColor: '#ff6384',
        yAxisID: 'y',
      },
      {
        label: 'Training Loss',
        data: [
          { key: '1', value: 0.25 },
          { key: '2', value: 0.92 },
          { key: '3', value: 0.58 },
          { key: '4', value: 1.05 },
          { key: '5', value: 0.46 },
          { key: '6', value: 0.64 },
          { key: '7', value: 0.63 },
          { key: '8', value: 0.29 },
          { key: '9', value: 0.61 },
          { key: '10', value: 0.98 },
        ],
        parsing: {
          xAxisKey: 'key',
          yAxisKey: 'value',
        },

        borderColor: '#36a2eb',
        backgroundColor: '#36a2eb',
        yAxisID: 'y1',
      },
    ],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Two-Line Chart',
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
      y: {
        title: {
          display: true,
          text: 'Accuracy',
        },
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Loss',
        },
      },
    },
  };
}
