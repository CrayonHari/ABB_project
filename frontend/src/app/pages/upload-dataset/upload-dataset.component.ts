import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileDropComponent } from '../../shared/components/file-drop/file-drop.component';
import { FormProgressService } from '../../services/form-progress.service';
import { Router } from '@angular/router';
import { UploadApiService } from '../../services/upload-api.service';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

interface UploadResponse {
  message: string;
  totalRecords: number;
  columnCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  passRate: number;
}

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [ButtonComponent, FileDropComponent, CommonModule, LoaderComponent],
  templateUrl: './upload-dataset.component.html',
  styleUrl: './upload-dataset.component.css',
})
export class UploadDatasetComponent {
  selectedFile: File | null = null;
  isUploaded = false;
  isLoading = false;
  uploadResult?: UploadResponse;

  constructor(
    private router: Router,
    private formProgress: FormProgressService,
    private api: UploadApiService
  ) {}

  handleFile(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      alert('Only CSV files are allowed.');
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  uploadFile() {
    if (!this.selectedFile) {
      alert('Please select a valid CSV file.');
      return;
    }

    this.isLoading = true;

    this.api.uploadDataset(this.selectedFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.isUploaded = true;
        this.isLoading = false;

        // Store upload result to be shared with other pages
        this.formProgress.setData('uploadResult', res);
      },
      error: (err) => {
        alert('Upload failed: ' + (err?.error?.detail || 'Unknown error'));
        this.isUploaded = false;
        this.isLoading = false;
      },
    });
  }

  onNextClicked() {
    if (this.isUploaded) {
      this.formProgress.completeStep('upload-dataset');
      this.router.navigate(['/data-ranges']);
    } else {
      alert('Please upload a file before proceeding.');
    }
  }
}
