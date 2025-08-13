import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-live-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-table.component.html',
  styleUrl: './live-table.component.css',
})
export class LiveTableComponent implements OnInit, OnDestroy {
  tableData: { time: string; sales: number; revenue: number }[] = [];
  displayedColumns = ['time', 'sales', 'revenue'];
  private intervalId: any;

  getCellValue(
    row: { time: string; sales: number; revenue: number },
    column: string
  ): string | number {
    return row[column as keyof typeof row];
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const newRow = {
        time: now,
        sales: Math.floor(Math.random() * 100),
        revenue: Math.floor(Math.random() * 1000),
      };

      this.tableData.push(newRow);

      if (this.tableData.length > 10) {
        this.tableData.shift();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
