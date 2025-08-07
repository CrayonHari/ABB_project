import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class UploadApiService {
  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`http://localhost:8081/api/dataset/upload`, formData);
  }

  validateRanges(data: any) {
    return this.http.post<any>(
      'http://localhost:8081/api/dataset/validate-ranges',
      data
    );
  }

  trainModel(payload: {
    trainStart: string;
    trainEnd: string;
    testStart: string;
    testEnd: string;
  }): Observable<any> {
    return this.http.post('http://localhost:8081/api/model/train', payload);
  }

  predictSingle(payload: any): Observable<any> {
    return this.http.post(
      'http://localhost:8081/api/model/predict-single',
      payload
    );
  }
}

export interface UploadResponse {
  message: string;
  totalRecords: number;
  columnCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  passRate: number;
}

export interface TrainingHistoryEntry {
  epoch: number;
  trainLoss: number;
  trainAccuracy: number;
}

export interface TrainingResponse {
  status: string;
  modelId: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][]; // [ [TN, FP], [FN, TP] ]
    trainingHistory: TrainingHistoryEntry[];
  };
}
export interface SensorData {
  Sample_ID: number;
  Temperature: number;
  Pressure: number;
  Response: string;
  Speed: number;
  Vibration: number;
  Voltage: number;
  synthetic_timestamp: string;
}

export interface Prediction {
  timestamp: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail'; // Capitalized
  confidence: number;
  sensorData: SensorData;
}
