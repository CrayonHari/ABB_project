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
  selector: 'app-donut-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css',
})
export class DonutChartComponent {
  @Input() confusionMatrix: number[][] | null | undefined;
  ngOnChanges() {
    if (
      this.confusionMatrix &&
      this.confusionMatrix.length === 2 &&
      this.confusionMatrix[0].length === 2 &&
      this.confusionMatrix[1].length === 2
    ) {
      const truePositive = this.confusionMatrix[1][1];
      const falsePositive = this.confusionMatrix[0][1];
      const falseNegative = this.confusionMatrix[1][0];
      const trueNegative = this.confusionMatrix[0][0];

      console.log('TP:', truePositive);
      console.log('TN:', trueNegative);
      console.log('FP:', falsePositive);
      console.log('FN:', falseNegative);

      // You can now use these in your chart
      this.chartData.datasets[0].data = [
        { key: 'True Positive', value: truePositive },
        { key: 'False Positive', value: falsePositive },
        { key: 'False Negative', value: falseNegative },
        { key: 'True Negative', value: trueNegative },
      ];
    }
  }

  chartData: ChartData<'doughnut', { key: string; value: number }[]> = {
    labels: [
      'True Positive',
      'False Positive',
      'False Negative',
      'True Negative',
    ],
    datasets: [
      {
        data: [],

        backgroundColor: ['#6BCB77', '#FFD93D', '#FF6B6B', '#4D96FF'],
        hoverOffset: 4,
      },
    ],
  };

  chartOptions: ChartOptions<'doughnut'> = {
    plugins: {
      title: {
        display: true,
        text: 'Confusion Matrix',
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
