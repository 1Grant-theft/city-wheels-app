import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  selectedMethod: string = '';
  carId: string | null = null;
  amount: number = 100.00; // Default amount
  isProcessing: boolean = false;
  errorMessage: string = '';

  // Reservation Properties
  pickupDate: string = '';
  returnDate: string = '';
  reservationNotes: string = '';
  policyAccepted: boolean = false;
  selectedCar: any = null;
  
  // Payment Modal Properties
  showPaymentModal: boolean = false;
  showSuccessModal: boolean = false;
  selectedPayMethod: string = 'card';
  lastTransactionId: string | number = '';
  depositAmount: number = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.carId = this.route.snapshot.paramMap.get('id');
    this.fetchCarDetails();
  }

  fetchCarDetails() {
    this.http.get('http://localhost:3000/api/cars').subscribe({
      next: (cars: any) => {
        this.selectedCar = cars.find((c: any) => c.id == this.carId);
        if (this.selectedCar) {
          this.amount = this.selectedCar.price_per_day;
          this.depositAmount = this.amount * 0.45;
        }
      },
      error: (err) => {
        console.error('Error fetching car details:', err);
      }
    });
  }

  getCarImage(url: string | null): string {
    if (!url) return 'assets/cars/default.png';
    if (url.startsWith('assets/')) return url;
    return `http://localhost:3000${url}`;
  }

  openPaymentModal() {
    if (!this.pickupDate || !this.returnDate) {
      this.errorMessage = 'Pickup and Return dates are required.';
      return;
    }

    if (new Date(this.returnDate) < new Date(this.pickupDate)) {
      this.errorMessage = 'Return date cannot be earlier than pickup date.';
      return;
    }

    this.errorMessage = '';
    this.showPaymentModal = true;
  }

  submitReservation() {
    this.processTransaction(this.selectedPayMethod || 'card_deposit');
  }

  private processTransaction(methodToSubmit: string) {
    this.isProcessing = true;
    this.errorMessage = '';

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const payload = {
      paymentMethod: methodToSubmit,
      amount: this.amount,
      carId: this.carId ? parseInt(this.carId, 10) : null,
      pickupDate: this.pickupDate,
      returnDate: this.returnDate,
      notes: this.reservationNotes
    };

    this.http.post('http://localhost:3000/payment', payload, { headers }).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        this.lastTransactionId = res.transactionId;
        this.showPaymentModal = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = err.error?.message || 'Transaction failed. Please try again.';
        console.error('Payment error:', err);
      }
    });

  }

}
