import { Component, OnInit, DoCheck, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, DoCheck {

  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isMenuOpen: boolean = false;
  userFirstName: string = '';

  constructor(public router: Router, private eRef: ElementRef) { }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  ngDoCheck(): void {
    this.checkLoginStatus();
  }

  get currentUrl(): string {
    return this.router.url;
  }

  checkLoginStatus() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token) {
      this.isLoggedIn = true;
      this.isAdmin = role === 'admin';
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userFirstName = payload.firstName || payload.email.split('@')[0];
        
        // Also check role from token if missing from storage
        if (!this.isAdmin && payload.role === 'admin') {
            this.isAdmin = true;
        }
      } catch (e) {
        this.userFirstName = 'User';
      }
    } else {
      this.isLoggedIn = false;
      this.isAdmin = false;
      this.userFirstName = '';
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
