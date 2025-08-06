import { Component, OnDestroy, OnInit } from '@angular/core';
import { LineChartFilledComponent } from '../../shared/components/line-chart-filled/line-chart-filled.component';
import { LiveTableComponent } from '../../shared/components/live-table/live-table.component';
import { CircleStatComponent } from '../../shared/components/circle-stat/circle-stat.component';

import { Subscription } from 'rxjs';
import { SignalRService } from '../../services/signalr.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UploadApiService } from '../../services/upload-api.service';
import { FormProgressService } from '../../services/form-progress.service';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LineChartFilledComponent,
    LiveTableComponent,
    CircleStatComponent,
    CommonModule,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css',
})
export class SimulationComponent implements OnInit, OnDestroy {
  predictions: any[] = [];
  statusMessage: string = '';
  private subscriptions: Subscription[] = [];
  constructor(
    private formProgressService: FormProgressService,
    private api: UploadApiService,
    private router: Router,
    private signalR: SignalRService
  ) {}
  ngOnInit(): void {
    this.signalR.startConnection(); // ✅ async connection setup

    this.subscriptions.push(
      this.signalR.simulationStatus$.subscribe(
        (msg) => (this.statusMessage = msg)
      ),
      this.signalR.predictionReceived$.subscribe((pred) =>
        this.predictions.push(pred)
      ),
      this.signalR.simulationError$.subscribe((err) => {
        console.error('Simulation error:', err);
        this.statusMessage = 'Error: ' + err;
      })
    );
  }

  async startSimulation(): Promise<void> {
    this.predictions = [];

    const splitTimes = this.formProgressService.getData<any>('splitTimes');
    const training = splitTimes?.find((item: any) => item.label === 'training');
    const simulation = splitTimes?.find(
      (item: any) => item.label === 'simulation'
    );

    if (
      !training ||
      !training.startDate ||
      !training.endDate ||
      !simulation ||
      !simulation.startDate ||
      !simulation.endDate
    ) {
      alert('Please select valid training and simulation date ranges.');
      return;
    }

    const simulationPeriod = {
      startDate: simulation.startDate,
      endDate: simulation.endDate,
    };

    try {
      await this.signalR.startConnection(); // ✅ Ensure connection is established
      this.signalR.startSimulation(simulationPeriod); // ✅ Then invoke server call
    } catch (err) {
      console.error('Failed to start simulation:', err);
      this.statusMessage = 'Error: Could not start simulation.';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.signalR.disconnect(); // optional cleanup
  }
}
