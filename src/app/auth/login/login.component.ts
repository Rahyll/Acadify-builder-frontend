import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { MessageService } from "primeng/api";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthService, LoginCredentials, User } from "../services/auth.service";
import { UserRole } from "../models/role.model";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  providers: [MessageService],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  showForgotPassword = false;
  forgotPasswordEmail = "";
  forgotPasswordLoading = false;
  returnUrl = "";

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
  ) {
    // Initialize form immediately in constructor
    this.initializeForm();
  }

  ngOnInit() {
    // Check if user is already authenticated
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.redirectAfterLogin();
        }
      });

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "";
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm() {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
      rememberMe: [false],
    });
    console.log("Login form initialized:", this.loginForm);
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.loading = true;
      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authService
        .login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.success) {
              this.messageService.add({
                severity: "success",
                summary: "Login Successful",
                detail: `Welcome back, ${response.user?.firstName}!`,
                life: 3000,
              });

              // Redirect based on user role
              setTimeout(() => {
                this.redirectBasedOnRole(response.user);
              }, 1000);
            }
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: "error",
              summary: "Login Failed",
              detail: error.message || "Invalid email or password",
              life: 5000,
            });
          },
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  onForgotPassword() {
    if (
      !this.forgotPasswordEmail ||
      !this.isValidEmail(this.forgotPasswordEmail)
    ) {
      this.messageService.add({
        severity: "warn",
        summary: "Invalid Email",
        detail: "Please enter a valid email address",
        life: 3000,
      });
      return;
    }

    this.forgotPasswordLoading = true;
    this.authService
      .forgotPassword(this.forgotPasswordEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.forgotPasswordLoading = false;
          this.messageService.add({
            severity: response.success ? "success" : "error",
            summary: response.success ? "Email Sent" : "Error",
            detail: response.message,
            life: 5000,
          });

          if (response.success) {
            this.showForgotPassword = false;
            this.forgotPasswordEmail = "";
          }
        },
        error: (error) => {
          this.forgotPasswordLoading = false;
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to send reset email. Please try again.",
            life: 5000,
          });
        },
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    this.forgotPasswordEmail = "";
  }

  getDemoCredentials() {
    return [
      { role: "Admin", email: "admin@college.edu", password: "password123" },
      {
        role: "Faculty",
        email: "sarah.wilson@college.edu",
        password: "password123",
      },
      {
        role: "HOD",
        email: "patricia.kumar@college.edu",
        password: "password123",
      },
      {
        role: "Admission Officer",
        email: "emily.brown@college.edu",
        password: "password123",
      },
    ];
  }

  fillDemoUser(email: string): void {
    this.loginForm.patchValue({
      email: email,
      password: "password123",
    });
  }

  private redirectAfterLogin(): void {
    const currentUser = this.authService.getCurrentUser();
    this.redirectBasedOnRole(currentUser);
  }

  private redirectBasedOnRole(user: User | null) {
    try {
      if (this.returnUrl && this.returnUrl !== "") {
        // If there's a specific return URL, use it
        this.router.navigate([this.returnUrl]);
        return;
      }

      // Default role-based routing using new UserRole enum
      const userRole = user?.role as UserRole;
      switch (userRole) {
        case UserRole.ADMIN:
          this.router.navigate(["/admin"]);
          break;
        case UserRole.FACULTY:
        case UserRole.HOD:
          this.router.navigate(["/faculty"]);
          break;
        case UserRole.ADMISSION_OFFICER:
          this.router.navigate(["/admission-officer"]);
          break;
        case UserRole.LIBRARIAN:
          this.router.navigate(["/library"]);
          break;
        case UserRole.ASSET_MANAGER:
          this.router.navigate(["/asset-management"]);
          break;
        case UserRole.STUDENT:
        default:
          this.router.navigate(["/dashboard"]);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback navigation
      this.router.navigate(["/dashboard"]);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors["required"]) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors["email"]) {
        return "Please enter a valid email address";
      }
      if (control.errors["minlength"]) {
        return `Password must be at least ${control.errors["minlength"].requiredLength} characters`;
      }
    }
    return "";
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: "Email",
      password: "Password",
    };
    return labels[fieldName] || fieldName;
  }
}
