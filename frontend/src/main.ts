import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideCharts } from 'ng2-charts';
import { BarController, Colors, Legend } from 'chart.js';
bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);

provideCharts({ registerables: [BarController, Legend, Colors] });
