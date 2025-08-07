import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { UploadDatasetComponent } from '../../pages/upload-dataset/upload-dataset.component';
import { DataRangesComponent } from '../../pages/data-ranges/data-ranges.component';
import { ModelTrainingComponent } from '../../pages/model-training/model-training.component';
import { SimulationComponent } from '../../pages/simulation/simulation.component';
import { LoaderService } from '../../services/loader.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { Event } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    RouterOutlet,
    NgClass,
    UploadDatasetComponent,
    DataRangesComponent,
    ModelTrainingComponent,
    SimulationComponent,
    CommonModule,
    LoaderComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  currentRoute: string = '';
  pageNo: number = 1;

  constructor(public loaderService: LoaderService, private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((event: Event) => {
      // Show loader when navigation starts
      if (event instanceof NavigationStart) {
        this.loaderService.show();
      }

      // Hide loader and update page number when navigation ends or fails
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loaderService.hide();

        if (event instanceof NavigationEnd) {
          this.currentRoute = event.urlAfterRedirects;

          if (this.currentRoute.includes('upload-dataset')) {
            this.pageNo = 1;
          } else if (this.currentRoute.includes('data-ranges')) {
            this.pageNo = 2;
          } else if (this.currentRoute.includes('model-training')) {
            this.pageNo = 3;
          } else if (this.currentRoute.includes('simulation')) {
            this.pageNo = 4;
          }

          setTimeout(() => {
            if (this.scrollContainer) {
              this.scrollContainer.nativeElement.scrollTop = 0;
            }
          }, 0);
        }
      }
    });
  }
}
