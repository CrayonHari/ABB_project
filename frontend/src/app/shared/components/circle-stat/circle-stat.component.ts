import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import {
  Chart as ChartJS,
  LineController,
  BarController,
  DoughnutController,
  PieController,
  RadarController,
  PolarAreaController,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  LineController,
  BarController,
  DoughnutController,
  PieController,
  RadarController,
  PolarAreaController,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  TimeScale,
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
export class CircleStatComponent implements OnChanges {
  @Input() passed: number = 0;
  @Input() failed: number = 0;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  chartData: ChartData<'doughnut', { key: string; value: number }[]> = {
    datasets: [
      {
        data: [{ key: '', value: 0 }],
        backgroundColor: ['#4CAF50', '#F44336'],
      },
    ],
  };

  chartOptions: ChartOptions<'doughnut'> = {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['passed'] || changes['failed']) {
      this.updateChartData();
    }
  }

  updateChartData(): void {
    this.chartData.datasets[0].data = [
      { key: '', value: this.passed },
      { key: '', value: this.failed },
    ];
    this.chart?.update(); // ← trigger chart redraw
  }
}
