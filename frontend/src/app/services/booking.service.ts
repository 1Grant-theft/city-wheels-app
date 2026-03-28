import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  booking: any = null;

  setBooking(data: any) {
    this.booking = data;
  }

  getBooking() {
    return this.booking;
  }

  constructor() { }
}
