import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [NgClass],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent {
  @Input() message: string = 'Loading...';
  @Input() overlay: boolean = false;
}
