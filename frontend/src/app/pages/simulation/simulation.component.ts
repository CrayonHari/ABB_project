import { Component } from '@angular/core';
import { LineChartFilledComponent } from '../../shared/components/line-chart-filled/line-chart-filled.component';
import { LiveTableComponent } from '../../shared/components/live-table/live-table.component';
import { CircleStatComponent } from '../../shared/components/circle-stat/circle-stat.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [LineChartFilledComponent, LiveTableComponent, CircleStatComponent],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css',
})
export class SimulationComponent {}
