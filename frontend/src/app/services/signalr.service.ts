import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  simulationStatus$ = new Subject<string>();
  predictionReceived$ = new Subject<any>();
  simulationError$ = new Subject<string>();

  async startConnection(): Promise<void> {
    if (
      this.hubConnection &&
      this.hubConnection.state === signalR.HubConnectionState.Connected
    ) {
      return; // already connected
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:8081/simulationHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('SimulationStatus', (msg: string) => {
      this.simulationStatus$.next(msg);
    });

    this.hubConnection.on('ReceivePrediction', (data: any) => {
      this.predictionReceived$.next(data);
    });

    this.hubConnection.on('SimulationError', (err: string) => {
      this.simulationError$.next(err);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connection started.');
    } catch (err) {
      console.error('SignalR connection error:', err);
      throw err;
    }
  }

  startSimulation(simulationPeriod: { startDate: string; endDate: string }) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('StartSimulation', simulationPeriod);
    } else {
      throw new Error('SignalR not connected');
    }
  }

  disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
