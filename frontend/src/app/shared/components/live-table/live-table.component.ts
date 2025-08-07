import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-live-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-table.component.html',
  styleUrl: './live-table.component.css',
})
export class LiveTableComponent implements OnChanges {
  @Input() predictions: any[] = [];

  tableData: any[] = [];
  displayedColumns: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['predictions'] && this.predictions?.length > 0) {
      this.processPredictions();
    }
  }

  processPredictions(): void {
    if (!this.predictions || this.predictions.length === 0) {
      this.tableData = [];
      this.displayedColumns = [];
      return;
    }

    const formatTimestamp = (utc: string): string => {
      const date = new Date(utc);
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      };

      return new Intl.DateTimeFormat('en-GB', options).format(date);
    };

    this.tableData = this.predictions.map((p) => ({
      timestamp: formatTimestamp(p.timestamp),
      sampleId: p.sampleId,
      prediction: p.prediction,
      confidence: p.confidence,
      // You can also include sensorData here if needed
    }));

    this.displayedColumns = Object.keys(this.tableData[0]);
  }

  getCellValue(row: any, column: string): string | number {
    return row[column];
  }
}
