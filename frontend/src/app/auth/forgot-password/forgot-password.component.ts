import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email: string = '';
  isSubmitted: boolean = false;
  errorMessage: string = '';

  constructor() { }

  onSubmit() {
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    if (!this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Mock API call to send reset email
    setTimeout(() => {
      this.isSubmitted = true;
    }, 800);
  }

}
