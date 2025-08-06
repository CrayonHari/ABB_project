import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- The 'export' keyword was missing from these interfaces ---
export interface UploadResponse {
  message: string;
  totalRecords: number;
  columnCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  passRate: number;
}

export interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface TrainingResponse {
  status: string;
  modelId: string;
  metrics: TrainingMetrics;
}


@Injectable({
  providedIn: 'root',
})
export class UploadApiService {
  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`/api/dataset/upload`, formData);
  }

  validateRanges(data: any): Observable<any> {
    return this.http.post<any>(`/api/dataset/validate-ranges`, data);
  }

  trainModel(payload: any): Observable<TrainingResponse> {
    return this.http.post<TrainingResponse>('/api/model/train', payload);
  }

  predictSingle(payload: any): Observable<any> {
    return this.http.post('/api/model/predict-single', payload);
  }
}
