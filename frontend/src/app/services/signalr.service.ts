import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection!: signalR.HubConnection;

  // These properties were missing
  public simulationStatus$ = new Subject<string>();
  public predictionReceived$ = new Subject<any>();
  public simulationError$ = new Subject<string>();

  // This is now an async function that returns a Promise, so .catch() will work
  public async startConnection(): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/simulationHub') // RELATIVE URL
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceivePrediction', (data) => {
      this.predictionReceived$.next(data);
    });
    this.hubConnection.on('SimulationStatus', (status) => {
      this.simulationStatus$.next(status);
    });
    this.hubConnection.on('SimulationError', (err) => {
      this.simulationError$.next(err);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR Connection started');
    } catch (err) {
      console.log('Error while starting connection: ' + err);
      // Re-throw the error so the calling component's .catch() can see it
      throw err;
    }
  }

  public startSimulation(simulationPeriod: any): void {
    this.hubConnection.invoke('StartSimulation', simulationPeriod)
      .catch(err => console.error(err));
  }

  // This method was missing
  public disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}