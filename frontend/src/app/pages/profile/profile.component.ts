import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  activeTab: 'reservations' | 'history' = 'reservations';

  userData: any = null;
  reservations: any[] = [];
  history: any[] = [];

  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.isLoading = true;
    this.errorMessage = '';

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get('http://localhost:3000/user-transactions', { headers }).subscribe({
      next: (res: any) => {
        this.userData = res.user;
        this.reservations = res.transactions.filter((t: any) => t.status === 'reserved');
        this.history = res.transactions.filter((t: any) => t.status !== 'reserved');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch profile data', err);
        this.errorMessage = 'Could not load your profile data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  formatPaymentMethod(method: string): string {
    const methods: any = {
      'credit_card': 'Credit / Debit Card',
      'paypal': 'PayPal',
      'cash': 'Pay at Pickup'
    };
    return methods[method] || method;
  }

  isClearing: boolean = false;

  clearHistory() {
    if (!confirm('Are you sure you want to clear your rental history? This cannot be undone.')) return;

    this.isClearing = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.delete('http://localhost:3000/user-transactions/history', { headers }).subscribe({
      next: (res: any) => {
        alert(res.message || 'History cleared!');
        this.isClearing = false;
        this.fetchTransactions(); // Refresh lists
      },
      error: (err) => {
        console.error('Failed to clear history', err);
        alert('Could not clear history at this time.');
        this.isClearing = false;
      }
    });
  }

}
