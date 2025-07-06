import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ReactiveFormsModule } from "@angular/forms";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SharedModule } from "./shared/shared.module";

// PrimeNG modules
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";

@NgModule({ declarations: [AppComponent],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        SharedModule,
        ButtonModule,
        CardModule,
        ToastModule], providers: [MessageService, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
