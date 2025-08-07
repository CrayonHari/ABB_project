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
import { ErrorsuccessboxComponent } from '../../shared/components/errorsuccessbox/errorsuccessbox.component';
@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [
    DonutChartComponent,
    LineChartComponent,
    ButtonComponent,
    CommonModule,
    LoaderComponent,
    ErrorsuccessboxComponent,
  ],
  templateUrl: './model-training.component.html',
  styleUrl: './model-training.component.css',
})
export class ModelTrainingComponent {
  modelTrainingResult?: TrainingResponse;
  isLoading = false;
  trainingComplete = false;

  constructor(
    private formProgressService: FormProgressService,
    private api: UploadApiService,
    private router: Router
  ) {}

  confusionData?: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };

  trainingPreview: {
    epoch: number;
    trainLoss: number;
    trainAccuracy: number;
  }[] = [];

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
      this.showAlertBox(
        'Please select valid training and testing date ranges.',
        'error'
      );
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
          this.trainingComplete = true;

          const matrix = res.metrics.confusionMatrix;
          if (
            Array.isArray(matrix) &&
            matrix.length === 2 &&
            Array.isArray(matrix[0]) &&
            Array.isArray(matrix[1]) &&
            matrix[0].length === 2 &&
            matrix[1].length === 2
          ) {
            this.confusionData = {
              trueNegative: matrix[0][0],
              falsePositive: matrix[0][1],
              falseNegative: matrix[1][0],
              truePositive: matrix[1][1],
            };
          } else {
            this.confusionData = undefined;
          }

          // Safe assign training history
          this.trainingPreview = Array.isArray(res.metrics.trainingHistory)
            ? res.metrics.trainingHistory.slice(0, 20).map((item: any) => ({
                epoch: item.epoch,
                trainLoss: item.loss,
                trainAccuracy: item.accuracy,
              }))
            : [];

          this.formProgressService.completeStep('model-training');
          console.log(this.modelTrainingResult?.metrics?.trainingHistory);
          this.showAlertBox(
            'Model training completed successfully!',
            'success'
          );
        } else {
          this.showAlertBox('No data received from training API.', 'error');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Training failed', err);
        this.showAlertBox('Training API request failed.', 'error');
      },
    });
  }
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onNextClicked() {
    if (this.modelTrainingResult) {
      this.formProgressService.completeStep('model-training');

      this.router.navigate(['/simulation']);
    } else {
      this.showAlertBox('Please train the model before proceeding.', 'error');
    }
  }
}
