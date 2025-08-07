// Assuming your component looks something like this:
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  // The modified login function
  login() {
    const hardcodedUsername = 'admin';
    const hardcodedPassword = 'password123';

    if (this.username === hardcodedUsername && this.password === hardcodedPassword) {
      // Login successful: You can add navigation or other logic here.
      console.log('Login successful!');
      this.error = ''; // Clear any previous errors
    } else {
      // Login failed
      this.error = 'Invalid username or password.';
    }
  }
}