import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contactus',
  templateUrl: './contactus.component.html',
  styleUrls: ['./contactus.component.css']
})
export class ContactusComponent implements OnInit {

  contactData = {
    name: '',
    email: '',
    phone: '',
    reason: 'Ask a Question',
    message: ''
  };

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  onSubmit() {
    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.http.post('http://localhost:3000/api/contact', this.contactData).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        this.isSubmitting = false;
        this.resetForm();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send message. Please try again later.';
        this.isSubmitting = false;
      }
    });
  }

  resetForm() {
    this.contactData = {
      name: '',
      email: '',
      phone: '',
      reason: 'Ask a Question',
      message: ''
    };
  }

}
