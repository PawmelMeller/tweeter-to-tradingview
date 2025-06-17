import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { TwitterService } from './twitter.service';
import { BitcoinService } from './bitcoin.service';
import { BitcoinAltService } from './bitcoin-alt.service';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    TwitterService,
    BitcoinService,
    BitcoinAltService,
    importProvidersFrom(HttpClientModule, ReactiveFormsModule, BrowserAnimationsModule)
  ]
});
