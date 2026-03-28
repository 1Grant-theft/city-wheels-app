import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

    signupForm!: FormGroup;
    submitted = false;
    errorMessage = '';
    returnUrl: string = '/';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        this.signupForm = this.fb.group(
            {
                firstName: ['', Validators.required],
                lastName: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                phone: ['', Validators.required], // ✅ relaxed (NO regex)
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', Validators.required],

                terms: [false, Validators.requiredTrue]
            },
            {
                validators: this.mustMatch('password', 'confirmPassword')
            }
        );
    }

    // Easy access to form controls
    get f() {
        return this.signupForm.controls;
    }



    onSubmit(): void {
        console.log('SUBMIT CLICKED'); // 🔍 debug proof

        this.submitted = true;
        this.errorMessage = '';

        if (this.signupForm.invalid) {
            this.errorMessage = 'Please fill in all required fields correctly.';
            console.log('FORM INVALID', this.signupForm);
            return;
        }

        const payload = this.signupForm.value;

        this.authService.signup(payload).subscribe({
            next: () => {
                // Automatically log the user in after successful signup
                const loginPayload = {
                    email: payload.email,
                    password: payload.password
                };

                this.authService.login(loginPayload).subscribe({
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
                    error: () => {
                        // Fallback to login page just in case auto-login fails
                        this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl } });
                    }
                });
            },
            error: (err) => {
                this.errorMessage =
                    err?.error?.message || 'Signup failed. Please try again.';
            }
        });
    }

    // Password match validator
    mustMatch(password: string, confirmPassword: string) {
        return (formGroup: AbstractControl) => {
            const passControl = formGroup.get(password);
            const confirmPassControl = formGroup.get(confirmPassword);

            if (!passControl || !confirmPassControl) return;

            if (
                confirmPassControl.errors &&
                !confirmPassControl.errors['mustMatch']
            ) {
                return;
            }

            if (passControl.value !== confirmPassControl.value) {
                confirmPassControl.setErrors({ mustMatch: true });
            } else {
                confirmPassControl.setErrors(null);
            }
        };
    }
}