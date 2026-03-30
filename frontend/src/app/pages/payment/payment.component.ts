import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  totalDays: number = 0;
  totalAmount: number = 0;
  
  // Payment Modal Properties
  showPaymentModal: boolean = false;
  showSuccessModal: boolean = false;
  showPolicyModal: boolean = false;
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
    this.http.get(`${environment.apiUrl}/api/cars`).subscribe({
      next: (cars: any) => {
        this.selectedCar = cars.find((c: any) => c.id == this.carId);
        if (this.selectedCar) {
          this.amount = this.selectedCar.price_per_day;
          this.depositAmount = this.amount * 0.45;
          this.calculateTotal();
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
    return `${environment.apiUrl}${url}`;
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

  calculateTotal() {
    if (!this.pickupDate || !this.returnDate || !this.selectedCar) {
      this.totalDays = 0;
      this.totalAmount = 0;
      this.depositAmount = this.selectedCar ? this.selectedCar.price_per_day * 0.45 : 0;
      this.amount = this.selectedCar ? this.selectedCar.price_per_day : 0;
      return;
    }

    const start = new Date(this.pickupDate);
    const end = new Date(this.returnDate);
    
    // Prevent timezone shifts by just comparing the dates as UTC or naive but setting hours to 0 helps
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const diffTime = end.getTime() - start.getTime();
    let diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays < 0) {
       this.totalDays = 0;
       this.totalAmount = 0;
       this.depositAmount = this.selectedCar.price_per_day * 0.45;
       this.amount = this.selectedCar.price_per_day;
       return;
    }
    
    if (diffDays === 0) diffDays = 1;

    this.totalDays = diffDays;
    this.totalAmount = this.selectedCar.price_per_day * this.totalDays;
    this.depositAmount = this.totalAmount * 0.45;
    this.amount = this.totalAmount;
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

    this.http.post(`${environment.apiUrl}/payment`, payload, { headers }).subscribe({
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
