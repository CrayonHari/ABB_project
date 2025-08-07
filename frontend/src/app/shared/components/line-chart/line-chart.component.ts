import { Component, Input } from '@angular/core';
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
    datasets: [],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Training Accuracy and Loss',
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
        position: 'left',
      },
      y1: {
        title: {
          display: true,
          text: 'Loss',
        },
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  @Input() set trainingHistoryInput(
    value:
      | { epoch: number; trainLoss: number; trainAccuracy: number }[]
      | undefined
  ) {
    const history = value ?? [];

    // Format the datasets dynamically based on input
    const accuracyData = history.map((entry) => ({
      key: entry.epoch.toString(),
      value: entry.trainAccuracy,
    }));

    const lossData = history.map((entry) => ({
      key: entry.epoch.toString(),
      value: entry.trainLoss,
    }));

    this.chartData = {
      datasets: [
        {
          label: 'Training Accuracy',
          data: accuracyData,
          parsing: {
            xAxisKey: 'key',
            yAxisKey: 'value',
          },
          borderColor: '#4caf50',
          backgroundColor: '#4caf50',
          yAxisID: 'y',
        },
        {
          label: 'Training Loss',
          data: lossData,
          parsing: {
            xAxisKey: 'key',
            yAxisKey: 'value',
          },
          borderColor: '#f44336',
          backgroundColor: '#f44336',
          yAxisID: 'y1',
        },
      ],
    };
  }
}
