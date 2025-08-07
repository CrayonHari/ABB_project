import { Component, Input } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
@Component({
  selector: 'app-errorsuccessbox',
  standalone: true,
  imports: [NgClass, CommonModule],
  templateUrl: './errorsuccessbox.component.html',
  styleUrl: './errorsuccessbox.component.css',
})
export class ErrorsuccessboxComponent {
  @Input() type: 'error' | 'success' = 'success'; // controls styles
  @Input() message: string = '';
}
