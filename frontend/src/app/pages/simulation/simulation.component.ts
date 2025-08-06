import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { SignalRService } from '../../services/signalr.service';
import { FormProgressService } from '../../services/form-progress.service';

// Import your shared components
import { LineChartFilledComponent } from '../../shared/components/line-chart-filled/line-chart-filled.component';
import { LiveTableComponent } from '../../shared/components/live-table/live-table.component';
import { CircleStatComponent } from '../../shared/components/circle-stat/circle-stat.component';


@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    LineChartFilledComponent,
    LiveTableComponent,
    CircleStatComponent,
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
    private router: Router,
    private signalR: SignalRService
  ) {}

  ngOnInit(): void {
    // Start the connection when the component loads. This is the ONLY place we call it.
    this.signalR.startConnection().catch(err => console.error("Initial SignalR connection failed:", err));

    // Subscribe to messages from the hub
    this.subscriptions.push(
      this.signalR.simulationStatus$.subscribe(
        (msg) => (this.statusMessage = msg)
      ),
      this.signalR.predictionReceived$.subscribe((prediction) => {
        console.log('Prediction Received:', prediction);
        this.predictions.unshift(prediction);
      }),
      this.signalR.simulationError$.subscribe((err) => {
        console.error('Simulation error:', err);
        this.statusMessage = 'Error: ' + err;
      })
    );
  }

  // This method is called when the user clicks the "Start Simulation" button
  startSimulation(): void {
    this.predictions = [];
    this.statusMessage = 'Starting simulation...';

    const splitTimes = this.formProgressService.getData<any>('splitTimes');
    const simulation = splitTimes?.find(
      (item: any) => item.label === 'simulation'
    );

    if (!simulation || !simulation.startDate || !simulation.endDate) {
      alert('Could not find simulation date range. Please go back and select dates.');
      this.statusMessage = 'Error: Missing date range.';
      return;
    }

    const simulationPeriod = {
      startDate: simulation.startDate,
      endDate: simulation.endDate,
    };
    
    console.log('Sending simulation request for period:', simulationPeriod);

    // --- THIS IS THE FIX ---
    // We no longer call startConnection() here. We just invoke the method
    // on the already-established connection from ngOnInit.
    try {
      this.signalR.startSimulation(simulationPeriod);
    } catch (err) {
      console.error('Failed to start simulation:', err);
      this.statusMessage = 'Error: Could not start simulation.';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.signalR.disconnect();
  }
}
