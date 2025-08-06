import { Component } from '@angular/core';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UploadApiService } from '../../services/upload-api.service';
import { LoaderService } from '../../services/loader.service';
import { FormProgressService } from '../../services/form-progress.service';
import { Router } from '@angular/router';

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
  standalone: true,  // <-- ADD THIS // <-- ADD THIS
  imports: [BarChartComponent, ButtonComponent, CommonModule, FormsModule],
  templateUrl: './data-ranges.component.html',
  styleUrl: './data-ranges.component.css',
})
export class DataRangesComponent {
  training: DateRange = { startDate: '', endDate: '' };
  testing: DateRange = { startDate: '', endDate: '' };
  simulation: DateRange = { startDate: '', endDate: '' };

  recordCounts: any = null;
  isValid: boolean = false;

  constructor(
    private api: UploadApiService,
    public loaderService: LoaderService,
    private router: Router,
    private formProgress: FormProgressService
  ) {}

  validateRanges() {
    const body = {
      trainingPeriod: this.training,
      testingPeriod: this.testing,
      simulationPeriod: this.simulation,
    };

    this.loaderService.show();
    this.api.validateRanges(body).subscribe({
      next: (res) => {
        this.recordCounts = res.recordCounts;
        this.isValid = res.isValid;
        this.loaderService.hide();
      },
      error: (err) => {
        alert(err?.error?.message || 'Validation failed.');
        this.recordCounts = null;
        this.isValid = false;
        this.loaderService.hide();
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
      alert('No valid date range available from uploaded dataset.');
      return;
    }

    const startUTC = new Date(uploadResult.dateRangeStart + 'Z');
    const endUTC = new Date(uploadResult.dateRangeEnd + 'Z');

    const totalMs = endUTC.getTime() - startUTC.getTime();

    if (totalMs <= 0) {
      alert('Invalid date range. End date must be after start date.');
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

    console.log('Split Times:', this.splitTimes);
  }

  onNextClicked() {
    if (this.isValid) {
      this.formProgress.setData('splitTimes', this.splitTimes);
      this.formProgress.completeStep('data-ranges');
      this.router.navigate(['/model-training']);
    } else {
      alert('Please validate the date ranges before proceeding.');
    }
  }
}
