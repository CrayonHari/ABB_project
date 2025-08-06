import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FormProgressService {
  constructor() {}

  // Track form step completion
  private progress: { [key: string]: boolean } = {
    'upload-dataset': false,
    'data-ranges': false,
    'model-training': false,
  };

  completeStep(step: string) {
    this.progress[step] = true;
  }

  isStepCompleted(step: string): boolean {
    return this.progress[step];
  }

  // --- Shared data support ---
  private sharedData: { [key: string]: any } = {};

  setData(key: string, value: any): void {
    this.sharedData[key] = value;
  }

  getData<T>(key: string): T | undefined {
    return this.sharedData[key];
  }

  clearData(key: string): void {
    delete this.sharedData[key];
  }

  clearAll(): void {
    this.sharedData = {};
  }
}
