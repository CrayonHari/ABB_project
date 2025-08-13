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
  standalone: true,
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

    const start = new Date(uploadResult.dateRangeStart);
    const end = new Date(uploadResult.dateRangeEnd);

    // Normalize seconds and milliseconds to 0
    start.setSeconds(0, 0);
    end.setSeconds(0, 0);

    const totalMs = end.getTime() - start.getTime();
    const trainMs = totalMs * 0.7;
    const testMs = totalMs * 0.2;
    const simMs = totalMs * 0.1;

    const trainEnd = new Date(start.getTime() + trainMs - 1000); // -1s for no overlap
    const testStart = new Date(trainEnd.getTime() + 1000);
    const testEnd = new Date(testStart.getTime() + testMs - 1000);
    const simStart = new Date(testEnd.getTime() + 1000);
    const simEnd = new Date(simStart.getTime() + simMs);

    // Format for datetime-local input: 'YYYY-MM-DDTHH:mm'
    const fmt = (d: Date) => d.toISOString().slice(0, 16);

    this.training.startDate = fmt(start);
    this.training.endDate = fmt(trainEnd);

    this.testing.startDate = fmt(testStart);
    this.testing.endDate = fmt(testEnd);

    this.simulation.startDate = fmt(simStart);
    this.simulation.endDate = fmt(simEnd);
  }

  onNextClicked() {
    if (this.isValid) {
      this.formProgress.completeStep('data-ranges');
      this.router.navigate(['/model-training']);
    } else {
      alert('Please validate the date ranges before proceeding.');
    }
  }
}
