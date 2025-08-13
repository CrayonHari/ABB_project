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
    return this.http.post(`http://localhost:5247/api/dataset/upload`, formData);
  }

  validateRanges(data: any) {
    return this.http.post<any>(
      'http://localhost:5247/api/dataset/validate-ranges',
      data
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
