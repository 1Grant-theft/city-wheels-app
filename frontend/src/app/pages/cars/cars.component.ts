import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cars',
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.css']
})
export class CarsComponent implements OnInit {
  cars: any[] = [];
  filteredCars: any[] = [];
  isLoading: boolean = true;
  error: string = '';

  searchTerm: string = '';
  selectedCategory: string = 'All';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchCars();
  }

  fetchCars() {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/cars`).subscribe({
      next: (res) => {
        this.cars = res.map(car => {
          let imageUrl = 'assets/cars/default.png';
          if (car.image_url) {
            if (car.image_url.startsWith('assets/')) {
              imageUrl = car.image_url;
            } else {
              imageUrl = `${environment.apiUrl}${car.image_url}`;
            }
          }
          return {
            ...car,
            image: imageUrl
          };
        });
        this.filteredCars = [...this.cars];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load cars', err);
        this.error = 'Failed to load cars from the server.';
        this.isLoading = false;
      }
    });
  }

  filterCars() {
    this.filteredCars = this.cars.filter(car => {
      const matchesSearch = this.searchTerm ? 
        (car.make.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
         car.model.toLowerCase().includes(this.searchTerm.toLowerCase())) : true;
      
      const matchesCategory = this.selectedCategory !== 'All' ? 
        car.category === this.selectedCategory : true;

      return matchesSearch && matchesCategory;
    });
  }

}
