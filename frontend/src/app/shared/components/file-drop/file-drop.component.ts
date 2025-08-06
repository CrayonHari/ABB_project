import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-file-drop',
  standalone: true,
  imports: [],
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.css',
})
export class FileDropComponent {
  isDragging = false;
  fileName: string = '';

  @Output() fileDropped = new EventEmitter<File>();

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
      const file = Array.from(event.dataTransfer.files);
      this.fileName = file[0].name;
      this.fileDropped.emit(file[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const file = Array.from(input.files);
      this.fileName = file[0].name;
      this.fileDropped.emit(file[0]);
    }
  }
}
