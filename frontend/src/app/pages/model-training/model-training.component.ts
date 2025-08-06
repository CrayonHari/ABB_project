import { Component } from '@angular/core';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { LineChartComponent } from '../../shared/components/line-chart/line-chart.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [DonutChartComponent, LineChartComponent, ButtonComponent],
  templateUrl: './model-training.component.html',
  styleUrl: './model-training.component.css',
})
export class ModelTrainingComponent {}
