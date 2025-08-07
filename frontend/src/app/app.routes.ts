import { Routes } from '@angular/router';
import { UploadDatasetComponent } from './pages/upload-dataset/upload-dataset.component';
import { DataRangesComponent } from './pages/data-ranges/data-ranges.component';
import { ModelTrainingComponent } from './pages/model-training/model-training.component';
import { SimulationComponent } from './pages/simulation/simulation.component';
import { formStepGuard } from './guards/form-step.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'upload-dataset', pathMatch: 'full' },
  { path: 'upload-dataset', component: UploadDatasetComponent },
  {
    path: 'data-ranges',
    component: DataRangesComponent,
    canActivate: [formStepGuard],
  },
  {
    path: 'model-training',
    component: ModelTrainingComponent,
    canActivate: [formStepGuard],
  },
  {
    path: 'simulation',
    component: SimulationComponent,
    canActivate: [formStepGuard],
  },
];
