import {
  CanActivateFn,
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { FormProgressService } from '../services/form-progress.service';
import { inject } from '@angular/core';

export const formStepGuard: CanActivateFn = (route, state) => {
  const formProgress = inject(FormProgressService);
  const router = inject(Router);

  const url = route.routeConfig?.path;

  if (url == 'data-ranges' && !formProgress.isStepCompleted('upload-dataset')) {
    router.navigate(['/data-ranges']);
    return false;
  }
  if (url == 'model-training' && !formProgress.isStepCompleted('data-ranges')) {
    router.navigate(['/model-training']);
    return false;
  }

  if (url == 'simulation' && !formProgress.isStepCompleted('model-training')) {
    router.navigate(['/simulation']);
    return false;
  }

  return true;
};
