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
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    LineChartFilledComponent,
    LiveTableComponent,
    CircleStatComponent,
    CommonModule,
    ButtonComponent,
  ],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.css',
})
export class SimulationComponent implements OnInit, OnDestroy {
  predictions: any[] = [];
  statusMessage: string = '';
  isRunning: boolean = false;
  isCompleted: boolean = false;

  private subscriptions: Subscription[] = [];
  constructor(
    private formProgressService: FormProgressService,
    private api: UploadApiService,
    private router: Router,
    private signalR: SignalRService
  ) {}
  ngAfterViewInit() {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTop = 0;
    }
  }
  addNewPrediction(newPrediction: any): void {
    // Update the array in an immutable way
    this.predictions = [...this.predictions, newPrediction];
  }
  private setupSignalRSubscriptions(): void {
    this.subscriptions.push(
      this.signalR.simulationStatus$.subscribe(
        (msg) => (this.statusMessage = msg)
      ),
      this.signalR.predictionReceived$.subscribe((prediction) => {
        this.addNewPrediction(prediction);
      }),
      this.signalR.simulationError$.subscribe((err) => {
        console.error('Simulation error:', err);
        this.statusMessage = 'Error: ' + err;
      })
    );
  }

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.signalR
      .startConnection()
      .then(() => {
        this.setupSignalRSubscriptions();
      })
      .catch((err) => console.error('Initial SignalR connection failed:', err));
  }

  startSimulation(): void {
    this.predictions = [];
    this.statusMessage = 'Starting simulation...';
    this.isRunning = true;
    this.isCompleted = false;

    const splitTimes = this.formProgressService.getData<any>('splitTimes');
    const simulation = splitTimes?.find(
      (item: any) => item.label === 'simulation'
    );

    if (!simulation || !simulation.startDate || !simulation.endDate) {
      alert(
        'Could not find simulation date range. Please go back and select dates.'
      );
      this.statusMessage = 'Error: Missing date range.';
      this.isRunning = false;
      return;
    }

    const simulationPeriod = {
      startDate: simulation.startDate,
      endDate: simulation.endDate,
    };

    // Reconnect and re-subscribe
    this.signalR
      .startConnection()
      .then(() => {
        // Unsubscribe old ones if any
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.subscriptions = [];

        // Setup fresh subscriptions
        this.setupSignalRSubscriptions();

        // Start the simulation
        this.signalR.startSimulation(simulationPeriod);
      })
      .catch((err) => {
        console.error('Reconnection failed:', err);
        this.statusMessage = 'Error: Could not reconnect.';
        this.isRunning = false;
      });
  }

  stopSimulation(): void {
    try {
      this.signalR.disconnect(); // Disconnects SignalR
      this.statusMessage = 'Simulation stopped by user.';
    } catch (err) {
      console.error('Failed to stop simulation:', err);
      this.statusMessage = 'Error: Could not stop simulation.';
    } finally {
      this.isRunning = false;
      this.isCompleted = true;
    }
  }

  goToStartPage(): void {
    this.formProgressService.clearAll(); // Or use specific key removals
    this.router.navigate(['/']);
  }
  clearAll(): void {
    localStorage.clear();
  }

  get total(): number {
    return this.predictions.length;
  }

  get passed(): number {
    return this.predictions.filter((p) => p.prediction.toLowerCase() === 'pass')
      .length;
  }

  get failed(): number {
    return this.predictions.filter((p) => p.prediction.toLowerCase() === 'fail')
      .length;
  }

  get avgConfidence(): number {
    if (this.predictions.length === 0) return 0;
    const total = this.predictions.reduce((sum, p) => sum + p.confidence, 0);
    return +(total / this.predictions.length).toFixed(2);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.signalR.disconnect(); // optional cleanup
  }
}
