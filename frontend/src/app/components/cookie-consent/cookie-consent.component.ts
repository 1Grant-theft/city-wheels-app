import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.css']
})
export class CookieConsentComponent implements OnInit {
  isVisible = false;
  showDetails = false;

  ngOnInit(): void {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      this.isVisible = true;
    }
  }

  accept(): void {
    localStorage.setItem('cookieConsent', 'accepted');
    this.isVisible = false;
  }

  decline(): void {
    localStorage.setItem('cookieConsent', 'declined');
    this.isVisible = false;
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }
}
