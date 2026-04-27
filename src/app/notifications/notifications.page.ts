import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import {
  Firestore,
  collection,
  query,
  where,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { HeaderComponent } from "../components/header/header.component";
import { FooterComponent } from "../components/footer/footer.component";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  notificationsOutline,
  checkmarkDoneOutline,
  trashOutline,
  checkmarkOutline,
  closeOutline,
  chevronForwardOutline
} from "ionicons/icons";
import { Subscription, switchMap, of } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    IonIcon,
    TranslatePipe,
    RouterLink
  ]
})
export class NotificationsPage implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private translate = inject(TranslateService);

  public notifications: any[] = [];
  public loading = true;
  private notiSub: Subscription | null = null;

  constructor() {
    addIcons({
      notificationsOutline,
      checkmarkDoneOutline,
      trashOutline,
      checkmarkOutline,
      closeOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.notiSub = authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          const notiRef = collection(this.firestore, 'notifications');
          const q = query(
            notiRef,
            where('userId', '==', user.uid)
          );
          return collectionData(q, { idField: 'id' });
        } else {
          return of([]);
        }
      })
    ).subscribe(data => {
      this.notifications = data.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.loading = false;
    });
  }

  ngOnDestroy() {
    if (this.notiSub) {
      this.notiSub.unsubscribe();
    }
  }

  async markAsRead(noti: any) {
    if (noti.read) return;

    try {
      const notiRef = doc(this.firestore, 'notifications', noti.id);
      await updateDoc(notiRef, { read: true });
    } catch (error) {
      console.error(error);
    }
  }

  async markAllAsRead() {
    const unread = this.notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(this.firestore);
      unread.forEach(noti => {
        const notiRef = doc(this.firestore, 'notifications', noti.id);
        batch.update(notiRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error(error);
    }
  }

  async deleteNotification(event: Event, id: string) {
    event.stopPropagation();

    if (confirm(this.translate.instant('NOTIFICATIONS.CONFIRM_DELETE'))) {
      try {
        await deleteDoc(doc(this.firestore, 'notifications', id));
      } catch (error) {
        console.error(error);
      }
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}
