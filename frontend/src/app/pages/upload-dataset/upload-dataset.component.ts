import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UploadApiService, UploadResponse } from '../../services/upload-api.service';
import { FormProgressService } from '../../services/form-progress.service';

// Shared component imports
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileDropComponent } from '../../shared/components/file-drop/file-drop.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';


@Component({
  selector: 'app-upload-dataset',
  standalone: true, // This makes the component standalone
  imports: [
    CommonModule, // Required for *ngIf, *ngFor, etc.
    ButtonComponent,
    FileDropComponent,
    LoaderComponent
  ],
  templateUrl: './upload-dataset.component.html',
  styleUrl: './upload-dataset.component.css',
})
// The "export" keyword here is CRITICAL for fixing the error.
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
      next: (res: UploadResponse) => {
        this.uploadResult = res;
        this.isUploaded = true;
        this.isLoading = false;
        this.formProgress.setData('uploadResult', res);
      },
      error: (err: any) => {
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
