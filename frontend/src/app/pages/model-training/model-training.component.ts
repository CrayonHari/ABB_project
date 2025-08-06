import { Component } from '@angular/core';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { LineChartComponent } from '../../shared/components/line-chart/line-chart.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormProgressService } from '../../services/form-progress.service';
import { UploadApiService } from '../../services/upload-api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { TrainingResponse } from '../../services/upload-api.service';
@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [
    DonutChartComponent,
    LineChartComponent,
    ButtonComponent,
    CommonModule,
    LoaderComponent,
  ],
  templateUrl: './model-training.component.html',
  styleUrl: './model-training.component.css',
})
export class ModelTrainingComponent {
  modelTrainingResult?: TrainingResponse;
  isLoading = false;
  trainingComplete = false; // ✅ added

  constructor(
    private formProgressService: FormProgressService,
    private api: UploadApiService,
    private router: Router
  ) {}

  startTraining() {
    const splitTimes = this.formProgressService.getData<any>('splitTimes');
    const training = splitTimes?.find((item: any) => item.label === 'training');
    const testing = splitTimes?.find((item: any) => item.label === 'testing');

    if (
      !training ||
      !training.startDate ||
      !training.endDate ||
      !testing ||
      !testing.startDate ||
      !testing.endDate
    ) {
      alert('Please select valid training and testing date ranges.');
      return;
    }

    const payload = {
      trainStart: training.startDate,
      trainEnd: training.endDate,
      testStart: testing.startDate,
      testEnd: testing.endDate,
    };

    this.isLoading = true;

    this.api.trainModel(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res) {
          this.modelTrainingResult = res;
          console.log(res);
          this.trainingComplete = true; // ✅ success flag
          this.formProgressService.completeStep('model-training');
        } else {
          alert('No data received from training API.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Training failed', err);
        alert('Training API request failed.');
      },
    });
  }

  onNextClicked() {
    if (this.modelTrainingResult) {
      this.formProgressService.completeStep('model-training');
      this.router.navigate(['/simulation']);
    } else {
      alert('Please upload a file before proceeding.');
    }
  }
}
