import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

  activeTab: any = 'users';

  users: any[] = [];
  isLoadingUsers: boolean = true;
  userError: string = '';

  cars: any[] = [];
  isLoadingCars: boolean = true;
  carError: string = '';
  editingCar: any = null;

  // Add Car Form Data
  carData: {
    make: string,
    model: string,
    year: number,
    price_per_day: number | null,
    category: string,
    transmission: string,
    seats: number
  } = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price_per_day: null,
    category: 'Sedan',
    transmission: 'Automatic',
    seats: 5
  };
  selectedFile: File | null = null;
  isSubmitting: boolean = false;
  submitMessage: { type: 'success' | 'error', text: string } | null = null;

  // Analytics Stats
  stats = {
    totalRevenue: 0,
    activeReservations: 0,
    fleetSize: 0,
    totalUsers: 0
  };

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchCars();
    this.fetchGlobalTransactions();
  }

  fetchGlobalTransactions() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(`${environment.apiUrl}/api/admin/transactions`, { headers }).subscribe({
      next: (res) => {
        this.calculateStats(res);
      },
      error: (err) => console.error('Failed to fetch global transactions', err)
    });
  }

  calculateStats(transactions: any[]) {
    if (!transactions || !Array.isArray(transactions)) return;

    // Total Revenue (Completed transactions + any partial deposits)
    this.stats.totalRevenue = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    
    // Active Reservations
    this.stats.activeReservations = transactions.filter(tx => tx.status === 'reserved').length;
    
    // Fleet Size is set in fetchCars()
    // Total Users is set in fetchUsers()
  }

  fetchUsers() {
    this.isLoadingUsers = true;
    this.userError = '';

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>(`${environment.apiUrl}/api/users`, { headers }).subscribe({
      next: (res) => {
        this.users = res;
        this.stats.totalUsers = res.length;
        this.isLoadingUsers = false;
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.userError = 'Failed to load users. Are you sure you are an admin?';
        this.isLoadingUsers = false;
      }
    });
  }

  fetchCars() {
    this.isLoadingCars = true;
    this.carError = '';
    this.http.get<any[]>(`${environment.apiUrl}/api/cars`).subscribe({
      next: (res) => {
        this.cars = res;
        this.stats.fleetSize = res.length;
        this.isLoadingCars = false;
      },
      error: (err) => {
        console.error('Failed to fetch cars', err);
        this.carError = 'Failed to load cars.';
        this.isLoadingCars = false;
      }
    });
  }

  deleteUser(userId: number) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all their rental history.')) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.delete(`${environment.apiUrl}/api/users/${userId}`, { headers }).subscribe({
      next: () => {
        alert('User deleted successfully.');
        this.fetchUsers(); // refresh the list
      },
      error: (err) => {
        console.error('Failed to delete user', err);
        alert(err.error?.message || 'Failed to delete user.');
      }
    });
  }

  selectedUserForHistory: any = null;
  userHistory: any[] = [];
  pastReservations: any[] = [];
  presentReservations: any[] = [];
  isLoadingHistory: boolean = false;

  viewUserHistory(user: any) {
    this.selectedUserForHistory = user;
    this.isLoadingHistory = true;
    this.userHistory = [];
    this.pastReservations = [];
    this.presentReservations = [];

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users/${user.id}/transactions`, { headers }).subscribe({
      next: (res) => {
        this.userHistory = res;
        this.pastReservations = res.filter(tx => tx.status !== 'reserved');
        this.presentReservations = res.filter(tx => tx.status === 'reserved');
        this.isLoadingHistory = false;
      },
      error: (err) => {
        console.error('Failed to fetch user history', err);
        alert('Could not load user history.');
        this.isLoadingHistory = false;
      }
    });
  }

  closeHistoryModal() {
    this.selectedUserForHistory = null;
    this.userHistory = [];
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  onAddCarSubmit() {
    this.submitMessage = null;

    if (!this.carData.make || !this.carData.model || this.carData.price_per_day === null || typeof this.carData.price_per_day === 'undefined' || !this.selectedFile) {
      this.submitMessage = { type: 'error', text: 'Please fill in all required fields and upload an image.' };
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('make', this.carData.make);
    formData.append('model', this.carData.model);
    formData.append('year', this.carData.year.toString());
    formData.append('price_per_day', (this.carData.price_per_day ?? 0).toString());
    formData.append('category', this.carData.category);
    formData.append('transmission', this.carData.transmission);
    formData.append('seats', this.carData.seats.toString());
    formData.append('image', this.selectedFile);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${environment.apiUrl}/api/cars`, formData, { headers }).subscribe({
      next: (res: any) => {
        this.submitMessage = { type: 'success', text: 'Car successfully added to the database!' };
        this.isSubmitting = false;
        // Reset form
        this.carData = {
          make: '', model: '', year: new Date().getFullYear(),
          price_per_day: null, category: 'Sedan', transmission: 'Automatic', seats: 5
        };
        this.selectedFile = null;
        const fileInput = document.getElementById('carImage') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        console.error('Error adding car', err);
        this.submitMessage = { type: 'error', text: err.error?.message || 'Failed to add car. Please try again.' };
        this.isSubmitting = false;
      }
    });
  }

  editCar(car: any) {
    this.editingCar = { ...car };
  }

  cancelEditCar() {
    this.editingCar = null;
  }

  saveCarEdit() {
    if (!this.editingCar) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.put(`${environment.apiUrl}/api/cars/${this.editingCar.id}`, this.editingCar, { headers }).subscribe({
      next: () => {
        alert('Car updated successfully.');
        this.editingCar = null;
        this.fetchCars(); // Refresh the list
      },
      error: (err) => {
        console.error('Failed to update car', err);
        alert(err.error?.message || 'Failed to update car details.');
      }
    });
  }
}
