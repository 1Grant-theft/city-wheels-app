import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-car-details',
  templateUrl: './car-details.component.html',
  styleUrls: ['./car-details.component.css']
})
export class CarDetailsComponent implements OnInit {

  currentImageIndex: number = -1;
  currentImages: string[] = [];
  carID!: number;
  car: any;
  isLoading: boolean = true;
  error: string = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

  ngOnInit(): void {
    this.carID = Number(this.route.snapshot.paramMap.get('id'));
    this.fetchCarDetails();
  }

  fetchCarDetails() {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/cars`).subscribe({
      next: (res) => {
        const foundCar = res.find(c => c.id == this.carID);
        if (foundCar) {
            let imageUrl = 'assets/cars/default.png';
            if (foundCar.image_url) {
                if (foundCar.image_url.startsWith('assets/')) {
                    imageUrl = foundCar.image_url;
                } else {
                    imageUrl = `${environment.apiUrl}${foundCar.image_url}`;
                }
            }
            
            // Re-attach interior images based on model heuristics since this wasn't in the DB
            let interiors: string[] = [];
            let makeModel = `${foundCar.make} ${foundCar.model}`.toLowerCase();
            
            if (makeModel.includes('axio')) interiors = [ 'assets/cars/interior/axio.interior.1.png', 'assets/cars/interior/axio.interior.2.png', 'assets/cars/interior/Axio.interior.3.webp' ];
            else if (makeModel.includes('fit')) interiors = [ 'assets/cars/interior/fit front.jpg', 'assets/cars/interior/fit back.jpg', 'assets/cars/interior/fit trunk.jpg' ];
            else if (makeModel.includes('vitz')) interiors = [ 'assets/cars/interior/vitz front.jpg', 'assets/cars/interior/vitz back.jpg', 'assets/cars/interior/vitz trunk.jpg' ];
            else if (makeModel.includes('sentra') || makeModel.includes('nissan')) interiors = [ 'assets/cars/interior/note front.jpg', 'assets/cars/interior/note back.jpg', 'assets/cars/interior/note trunk.jpg' ];
            else if (makeModel.includes('noah')) interiors = [ 'assets/cars/interior/noah front.jpg', 'assets/cars/interior/noah back.jpg', 'assets/cars/interior/noah trunk.png' ];
            else if (makeModel.includes('320i')) interiors = [ 'assets/cars/interior/bmw320i front.jpg', 'assets/cars/interior/bmw320i back.jpg', 'assets/cars/interior/bmw320i trunk.avif' ];
            else if (makeModel.includes('gle')) interiors = [ 'assets/cars/interior/gle63 front.jpg', 'assets/cars/interior/gle63 back.jpg', 'assets/cars/interior/gle63 trunk.jpg' ];
            else if (makeModel.includes('x6')) interiors = [ 'assets/cars/interior/bmwx6 front.webp', 'assets/cars/interior/bmwx6 back.webp', 'assets/cars/interior/bmwx6 trunk.jpg' ];
            else if (makeModel.includes('crown')) interiors = [ 'assets/cars/interior/crown front.jpg', 'assets/cars/interior/crown back.jpg', 'assets/cars/interior/crown trunk.jpg' ];
            else if (makeModel.includes('probox')) interiors = [ 'assets/cars/interior/probox front.jpg', 'assets/cars/interior/probox back.webp', 'assets/cars/interior/probox trunk.jpg' ];
            else if (makeModel.includes('accord')) interiors = [ 'assets/cars/interior/accord front.jpg', 'assets/cars/interior/accord back.jpg', 'assets/cars/interior/accord trunk.webp' ];
            else if (makeModel.includes('vezel')) interiors = [ 'assets/cars/interior/vezel front.jpg', 'assets/cars/interior/vezel back.jpg', 'assets/cars/interior/vezel trunk.jpg' ];

            this.car = {
                id: foundCar.id,
                name: `${foundCar.make} ${foundCar.model}`,
                price: foundCar.price_per_day,
                seats: foundCar.seats,
                transmission: foundCar.transmission,
                fuel: 'Gasoline', 
                mainImage: imageUrl,
                interiorImages: interiors,
                isCurrentlyReserved: foundCar.isCurrentlyReserved,
                reservedUntil: foundCar.reservedUntil
            };
        } else {
            this.error = 'Car not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load car details';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openImage(img: string) {
    if (this.car) {
      if (this.car.interiorImages && this.car.interiorImages.length > 0) {
        this.currentImages = [this.car.mainImage, ...this.car.interiorImages];
      } else {
        this.currentImages = [this.car.mainImage];
      }
      this.currentImageIndex = this.currentImages.indexOf(img);
    }
  }

  closeImage() {
    this.currentImageIndex = -1;
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (this.currentImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.currentImages.length;
    }
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (this.currentImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.currentImages.length) % this.currentImages.length;
    }
  }
}
