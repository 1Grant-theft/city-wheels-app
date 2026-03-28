import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  setCar(car: any) {
    localStorage.setItem('selectedCar', JSON.stringify(car));
  }
  getCar(): any {
    const car = localStorage.getItem('selectedCar');
    return car ? JSON.parse(car) : null;
      // throw new Error('Method not implemented.');
  }

  constructor() { }
}
