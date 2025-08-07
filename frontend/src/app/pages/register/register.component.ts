import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username = '';
  password = '';
  error = '';
  message = '';
  isLoading = false;

  // You can keep the AuthService for when you want to switch back
  constructor(private auth: AuthService, private router: Router) {}

  register() {
    this.isLoading = true;
    this.error = '';
    this.message = '';

    // Simulate a network delay of 1 second
    setTimeout(() => {
      // Check for hardcoded username and password
      if (this.username === 'user' && this.password === 'password123') {
        // --- SUCCESS CASE ---
        this.message = 'Registration successful! Redirecting to login...';
        
        // Redirect to login page
        this.router.navigate(['/login']);
      } else {
        // --- FAILURE CASE ---
        this.error = 'Invalid credentials. Please use the hardcoded values.';
      }

      this.isLoading = false; // Stop the loading state
    }, 1000);
  }
}