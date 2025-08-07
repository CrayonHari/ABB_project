import { Component } from '@angular/core';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UploadApiService } from '../../services/upload-api.service';
import { LoaderService } from '../../services/loader.service';
import { FormProgressService } from '../../services/form-progress.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ErrorsuccessboxComponent } from '../../shared/components/errorsuccessbox/errorsuccessbox.component';

interface DateRange {
  startDate: string;
  endDate: string;
}
interface SummaryData {
  message: string;
  totalRecords: number;
  columnCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  passRate: number;
}

@Component({
  selector: 'app-data-ranges',
  standalone: true,
  imports: [
    BarChartComponent,
    ButtonComponent,
    CommonModule,
    FormsModule,
    LoaderComponent,
    ErrorsuccessboxComponent,
  ],
  templateUrl: './data-ranges.component.html',
  styleUrl: './data-ranges.component.css',
})
export class DataRangesComponent {
  training: DateRange = { startDate: '', endDate: '' };
  testing: DateRange = { startDate: '', endDate: '' };
  simulation: DateRange = { startDate: '', endDate: '' };
  isLoading = false;

  recordCounts: any = null;
  isValid: boolean = false;

  constructor(
    private api: UploadApiService,
    public loaderService: LoaderService,
    private router: Router,
    private formProgress: FormProgressService
  ) {}

  alertMessage: string = '';
  alertType: 'success' | 'error' = 'error';
  showAlert: boolean = false;

  showAlertBox(message: string, type: 'success' | 'error' = 'error') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    setTimeout(() => {
      this.showAlert = false;
    }, 4000);
  }

  validateRanges() {
    const body = {
      trainingPeriod: this.training,
      testingPeriod: this.testing,
      simulationPeriod: this.simulation,
    };

    this.isLoading = true;

    this.api.validateRanges(body).subscribe({
      next: (res) => {
        this.recordCounts = res.recordCounts;
        this.isValid = res.isValid;
        this.isLoading = false;
        if (res.isValid) {
          console.log(this.recordCounts);

          this.showAlertBox('Date ranges validated successfully!', 'success');
        } else {
          this.showAlertBox(
            'Validation completed, but ranges are invalid.',
            'error'
          );
        }
      },
      error: (err) => {
        this.showAlertBox(err?.error?.message || 'Validation failed.', 'error');
        this.recordCounts = null;
        this.isValid = false;
        this.isLoading = false;
      },
    });
  }

  splitTimes: any[] = [];
  autoFillDateRanges() {
    const uploadResult = this.formProgress.getData(
      'uploadResult'
    ) as SummaryData;

    if (
      !uploadResult ||
      !uploadResult.dateRangeStart ||
      !uploadResult.dateRangeEnd
    ) {
      this.showAlertBox(
        'No valid date range available from uploaded dataset.',
        'error'
      );
      return;
    }

    const startUTC = new Date(uploadResult.dateRangeStart + 'Z');
    const endUTC = new Date(uploadResult.dateRangeEnd + 'Z');

    const totalMs = endUTC.getTime() - startUTC.getTime();

    if (totalMs <= 0) {
      this.showAlertBox(
        'Invalid date range. End date must be after start date.',
        'error'
      );
      return;
    }

    const trainMs = Math.floor(totalMs * 0.7);
    const testMs = Math.floor(totalMs * 0.2);
    const simMs = totalMs - trainMs - testMs - 2000; // subtract 2 seconds for gaps

    const trainStart = startUTC;
    const trainEnd = new Date(trainStart.getTime() + trainMs);

    const testStart = new Date(trainEnd.getTime() + 1000);
    const testEnd = new Date(testStart.getTime() + testMs);

    const simStart = new Date(testEnd.getTime() + 1000);
    const simEnd = endUTC;

    const fmt = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return (
        d.getUTCFullYear() +
        '-' +
        pad(d.getUTCMonth() + 1) +
        '-' +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        ':' +
        pad(d.getUTCMinutes()) +
        ':' +
        pad(d.getUTCSeconds())
      );
    };

    // Assign formatted values
    this.training = {
      startDate: fmt(trainStart),
      endDate: fmt(trainEnd),
    };
    this.testing = {
      startDate: fmt(testStart),
      endDate: fmt(testEnd),
    };
    this.simulation = {
      startDate: fmt(simStart),
      endDate: fmt(simEnd),
    };

    // Store all in splitTimes
    this.splitTimes = [
      { label: 'training', ...this.training },
      { label: 'testing', ...this.testing },
      { label: 'simulation', ...this.simulation },
    ];
  }

  onNextClicked() {
    if (this.isValid) {
      this.formProgress.setData('splitTimes', this.splitTimes);
      this.formProgress.completeStep('data-ranges');
      this.router.navigate(['/model-training']);
    } else {
      this.showAlertBox(
        'Please validate the date ranges before proceeding.',
        'error'
      );
      return;
    }
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
}
