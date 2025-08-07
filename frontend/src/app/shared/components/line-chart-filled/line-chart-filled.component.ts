import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-line-chart-filled',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './line-chart-filled.component.html',
  styleUrl: './line-chart-filled.component.css',
})
export class LineChartFilledComponent implements OnChanges {
  @Input() predictions: { confidence: number; timestamp: string }[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  chartData: ChartData<'line', { key: string; value: number }[]> = {
    datasets: [
      {
        label: 'Confidence Score',
        data: [],
        parsing: {
          xAxisKey: 'key',
          yAxisKey: 'value',
        },
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66, 165, 245, 0.2)',
        fill: true,
      },
    ],
  };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Real-Time Confidence Chart',
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
          text: 'Sample',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Confidence (%)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['predictions']) {
      this.updateChartData();
    }
  }

  updateChartData(): void {
    console.log('Chart updated:', this.predictions);

    // const limitedPredictions = this.predictions.slice(-20); // latest 20
    const limitedPredictions = this.predictions;
    this.chartData.datasets[0].data = limitedPredictions.map((p, index) => ({
      key: `${index + 1}`,
      value: p.confidence,
    }));

    this.chart?.update();
  }
}
