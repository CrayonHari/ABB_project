import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-file-drop',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.css',
})
export class FileDropComponent {
  isDragging = false;
  fileName: string = '';
  fileSize: number = 0; // in KB
  @Output() fileDropped = new EventEmitter<File>();
  @Output() fileInfo = new EventEmitter<{ name: string; size: number }>();

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        this.fileName = file.name;
        this.fileSize = Math.round(file.size / 1024);

        this.fileDropped.emit(file);
        this.fileInfo.emit({ name: this.fileName, size: this.fileSize });
      }
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        this.fileName = file.name;
        this.fileSize = Math.round(file.size / 1024); // convert to KB

        this.fileDropped.emit(file);
        this.fileInfo.emit({ name: this.fileName, size: this.fileSize });
      }
    }
  }
}
