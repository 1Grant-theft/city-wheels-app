import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  isLoggedIn: boolean = false;
  cars: any[] = [];
  isLoading: boolean = true;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.isLoggedIn = !!localStorage.getItem('token');
    this.fetchFeaturedCars();
  }

  fetchFeaturedCars() {
    this.http.get<any[]>(`${environment.apiUrl}/api/cars`).subscribe({
      next: (data) => {
        // Take the first 3 cars for the featured section
        this.cars = data.slice(0, 3);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch featured cars', err);
        this.isLoading = false;
      }
    });
  }

  activeFaq: number | null = null; // Currently active FAQ index
  slideIndex: number = 0;
  intervalId: any;

  ngAfterViewInit() {
    this.showSlide(this.slideIndex);
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  showSlide(i: number) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;

    if (i >= slides.length) this.slideIndex = 0;
    if (i < 0) this.slideIndex = slides.length - 1;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    if (slides[this.slideIndex]) slides[this.slideIndex].classList.add('active');
    if (dots[this.slideIndex]) dots[this.slideIndex].classList.add('active');
  }

  startAutoSlide() {
    this.intervalId = setInterval(() => {
      this.slideIndex++;
      this.showSlide(this.slideIndex);
    }, 4000);
  }

  stopAutoSlide() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  nextSlide() {
    this.stopAutoSlide();
    this.slideIndex++;
    this.showSlide(this.slideIndex);
    this.startAutoSlide();
  }

  prevSlide() {
    this.stopAutoSlide();
    this.slideIndex--;
    this.showSlide(this.slideIndex);
    this.startAutoSlide();
  }

  goToSlide(i: number) {
    this.stopAutoSlide();
    this.slideIndex = i;
    this.showSlide(this.slideIndex);
    this.startAutoSlide();
  }

  toggleFaq(index: number) {
    if (this.activeFaq === index) {
      this.activeFaq = null;
    } else {
      this.activeFaq = index;
    }
  }

}
