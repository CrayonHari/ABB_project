import { Component } from '@angular/core';
import { HeaderComponent } from './core/header/header.component';
import { FooterComponent } from './core/footer/footer.component';
import { MainComponent } from './core/main/main.component';
import { ButtonComponent } from './shared/components/button/button.component';
import { FileDropComponent } from './shared/components/file-drop/file-drop.component';
import { DonutChartComponent } from './shared/components/donut-chart/donut-chart.component';
import { BarChartComponent } from './shared/components/bar-chart/bar-chart.component';
import { LineChartComponent } from './shared/components/line-chart/line-chart.component';
import { LiveTableComponent } from './shared/components/live-table/live-table.component';
import { CircleStatComponent } from './shared/components/circle-stat/circle-stat.component';
import { LoaderComponent } from './shared/components/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    MainComponent,
    ButtonComponent,
    FileDropComponent,
    DonutChartComponent,
    BarChartComponent,
    LineChartComponent,
    LiveTableComponent,
    CircleStatComponent,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'frontend';
}
