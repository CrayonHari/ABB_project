
import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterOutlet,
  Event as RouterEvent,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../../services/loader.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

// We no longer need to import the page components here,
// as the router will handle loading them.
// This helps prevent circular dependency issues.

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    LoaderComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
  currentRoute: string = '';
  pageNo: number = 1;

  // Make sure LoaderService is public if you access it in the template
  constructor(public loaderService: LoaderService, private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.loaderService.show();
      }

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
        }
      }
    });
  }
}
