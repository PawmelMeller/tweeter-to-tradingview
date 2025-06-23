import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private activeRequests = 0;

  startLoading(): void {
    this.activeRequests++;
    this.loadingSubject.next(true);
  }

  stopLoading(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loadingSubject.next(false);
    }
  }

  forceStop(): void {
    this.activeRequests = 0;
    this.loadingSubject.next(false);
  }
}
