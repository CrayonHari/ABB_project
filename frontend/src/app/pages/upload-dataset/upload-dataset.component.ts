import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileDropComponent } from '../../shared/components/file-drop/file-drop.component';
import { FormProgressService } from '../../services/form-progress.service';
import { Router } from '@angular/router';
import { UploadApiService } from '../../services/upload-api.service';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ErrorsuccessboxComponent } from '../../shared/components/errorsuccessbox/errorsuccessbox.component';

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
  imports: [
    ButtonComponent,
    FileDropComponent,
    CommonModule,
    LoaderComponent,
    ErrorsuccessboxComponent,
  ],
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

  // Add at the top of the class
  alertMessage: string = '';
  alertType: 'success' | 'error' = 'error';
  showAlert: boolean = false;

  // Add this function to show the alert box
  showAlertBox(message: string, type: 'success' | 'error' = 'error') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // Optional: auto-dismiss after 4 seconds
    setTimeout(() => {
      this.showAlert = false;
    }, 4000);
  }

  fileName: string = '';
  fileSize: number = 0; // in KB
  onFileInfoReceived(info: { name: string; size: number }) {
    this.fileName = info.name;
    this.fileSize = info.size;
  }
  handleFile(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      this.showAlertBox('Only CSV files are allowed.', 'error');
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.showAlertBox('Please select a valid CSV file.', 'error');
      return;
    }

    this.isLoading = true;

    this.api.uploadDataset(this.selectedFile).subscribe({
      next: (res) => {
        this.uploadResult = res;
        this.isUploaded = true;
        this.isLoading = false;
        this.formProgress.setData('uploadResult', res);

        this.showAlertBox('Upload successful!', 'success'); // optional success alert
      },
      error: (err) => {
        this.showAlertBox(
          'Upload failed: ' + (err?.error?.detail || 'Unknown error'),
          'error'
        );
        this.isUploaded = false;
        this.isLoading = false;
      },
    });
  }
  formatDateDisplay(utcString: string): string {
    const date = new Date(utcString + 'Z'); // Ensure it's treated as UTC
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    };

    return new Intl.DateTimeFormat('en-GB', options).format(date);
  }
  onNextClicked() {
    if (this.isUploaded) {
      this.formProgress.completeStep('upload-dataset');
      this.router.navigate(['/data-ranges']);
    } else {
      this.showAlertBox('Please upload a file before proceeding.', 'error');
    }
  }
}
