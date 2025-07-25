import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AdmissionOfficerService } from "../services/admission-officer.service";
import {
  ApplicationOverview,
  ApplicationStatus,
  NotificationMessage,
} from "../../shared/models/application.interface";

@Component({
  selector: "app-officer-dashboard",
  templateUrl: "./officer-dashboard.component.html",
  styleUrls: ["./officer-dashboard.component.scss"],
})
export class OfficerDashboardComponent implements OnInit {
  loading = true;
  error: string | null = null;

  overview: ApplicationOverview | null = null;
  recentApplications: ApplicationStatus[] = [];
  notifications: NotificationMessage[] = [];

  // Statistics
  currentTime = new Date();
  greeting = "";

  constructor(
    private admissionService: AdmissionOfficerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.setGreeting();
    this.loadDashboardData();
    this.updateTime();
  }

  private setGreeting(): void {
    const hour = this.currentTime.getHours();
    if (hour < 12) {
      this.greeting = "Good Morning";
    } else if (hour < 17) {
      this.greeting = "Good Afternoon";
    } else {
      this.greeting = "Good Evening";
    }
  }

  private updateTime(): void {
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const [overview, applications, notifications] = await Promise.all([
        this.admissionService.getApplicationOverview().toPromise(),
        this.admissionService.getPendingApplications().toPromise(),
        this.admissionService.getNotifications("officer_001").toPromise(),
      ]);

      this.overview = overview || null;
      this.recentApplications = (applications || []).slice(0, 5);
      this.notifications = (notifications || []).slice(0, 5);
    } catch (error: any) {
      this.error = this.extractErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  // UI Helper Methods
  getReviewProgress(): number {
    if (!this.overview) return 0;
    const total = this.overview.totalApplications || 0;
    const pending = this.overview.pendingReview || 0;
    if (total === 0) return 100;
    return Math.round(((total - pending) / total) * 100);
  }

  getApprovalRate(): number {
    if (!this.overview) return 0;
    const total = this.overview.totalApplications || 0;
    const approved = this.overview.approved || 0;
    if (total === 0) return 0;
    return Math.round((approved / total) * 100);
  }

  getPendingRate(): number {
    if (!this.overview) return 0;
    const total = this.overview.totalApplications || 0;
    const pending = this.overview.pendingReview || 0;
    if (total === 0) return 0;
    return Math.round((pending / total) * 100);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case "info":
      case "application_submitted":
        return "pi pi-info-circle";
      case "warning":
      case "payment_due":
      case "resubmission_required":
        return "pi pi-exclamation-triangle";
      case "success":
      case "application_approved":
        return "pi pi-check-circle";
      case "error":
      case "application_rejected":
        return "pi pi-times-circle";
      default:
        return "pi pi-bell";
    }
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const targetDate = typeof date === "string" ? new Date(date) : date;
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return targetDate.toLocaleDateString();
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case "submitted":
      case "under_review":
        return "warning";
      case "approved":
      case "payment_completed":
      case "enrolled":
        return "success";
      case "rejected":
        return "danger";
      case "payment_pending":
        return "info";
      default:
        return "secondary";
    }
  }

  getNotificationSeverity(type: string): string {
    switch (type) {
      case "application_submitted":
        return "info";
      case "application_approved":
        return "success";
      case "application_rejected":
        return "danger";
      case "payment_due":
      case "resubmission_required":
        return "warning";
      default:
        return "secondary";
    }
  }

  // Navigation Methods
  navigateToReview(): void {
    this.router.navigate(["/admission-officer/review"]);
  }

  navigateToPayments(): void {
    this.router.navigate(["/admission-officer/payment"]);
  }

  viewApplication(applicationId: string): void {
    this.router.navigate(["/admission-officer/details", applicationId]);
  }

  // Quick Actions
  async quickApprove(applicationId: string): Promise<void> {
    try {
      await this.admissionService
        .updateApplicationStatus(applicationId, "approved")
        .toPromise();
      await this.loadDashboardData(); // Refresh data
    } catch (error: any) {
      this.error = this.extractErrorMessage(error);
    }
  }

  showRejectDialog(applicationId: string): void {
    // This would open a dialog for rejection reason
    // For now, using a simple prompt
    const reason = prompt("Please provide rejection reason:");
    if (reason) {
      this.quickReject(applicationId, reason);
    }
  }

  async quickReject(applicationId: string, reason: string): Promise<void> {
    try {
      await this.admissionService
        .updateApplicationStatus(applicationId, "rejected", reason)
        .toPromise();
      await this.loadDashboardData();
    } catch (error: any) {
      this.error = this.extractErrorMessage(error);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  private extractErrorMessage(error: any): string {
    if (error?.message) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  }
}
