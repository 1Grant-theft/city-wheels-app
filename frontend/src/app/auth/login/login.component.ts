import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    submitted = false;
    errorMessage = '';
    returnUrl: string = '/';
    showPassword = false;


    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            rememberMe: [false]
        });
    }

    ngOnInit(): void {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    get f() {
        return this.loginForm.controls;
    }

    onSubmit() {
        this.submitted = true;
        if (this.loginForm.invalid) {
            this.errorMessage = 'Please provide an email and password.';
            return;
        }

        const payload = { ...this.loginForm.value };

        this.auth.login(payload).subscribe({
            next: (res: any) => {
                localStorage.setItem('token', res.token);
                const role = res.role || 'user';
                localStorage.setItem('role', role);
                
                if (role === 'admin' && this.returnUrl === '/') {
                    this.router.navigateByUrl('/admin');
                } else if (role === 'user' && this.returnUrl === '/') {
                    this.router.navigateByUrl('/');
                } else {
                    this.router.navigateByUrl(this.returnUrl);
                }
            },
            error: err => {
                this.errorMessage = err.error?.message || 'Login failed';
            }
        });
    }
}