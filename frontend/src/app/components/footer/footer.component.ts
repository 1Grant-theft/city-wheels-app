import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  newsEmail: string = '';
  subscribed: boolean = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  subscribe() {
    if (!this.newsEmail) return;
    
    this.http.post(`${environment.apiUrl}/api/newsletter`, { email: this.newsEmail }).subscribe({
      next: () => {
        this.subscribed = true;
        this.newsEmail = '';
      },
      error: (err) => console.error('Subscription failed', err)
    });
  }

}
