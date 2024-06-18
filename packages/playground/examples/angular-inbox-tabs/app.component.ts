import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { renderWidget } from '@magicbell/embeddable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  @ViewChild('notifications') notifications: ElementRef;

  ngAfterViewInit() {
    const stores = [
      { id: 'default', defaultQueryParams: {} },
      { id: 'unread', defaultQueryParams: { read: true } },
      { id: 'billing', defaultQueryParams: { category: 'billing' } },
    ];

    const tabs = [
      { storeId: 'default', label: 'Latest' },
      { storeId: 'unread', label: 'Archive' },
      { storeId: 'billing', label: 'Billing' },
    ];

    renderWidget(this.notifications.nativeElement, {
      apiKey: '__MAGICBELL_API_KEY__',
      userEmail: '__MAGICBELL_USER_EMAIL__',
      userKey: '__MAGICBELL_USER_KEY__',
      stores,
      tabs,
    });
  }
}
