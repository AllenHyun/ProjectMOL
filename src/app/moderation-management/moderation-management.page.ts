import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, trashOutline, eyeOutline} from "ionicons/icons";
import {addDoc, collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where} from "@angular/fire/firestore";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HeaderComponent} from "../components/header/header.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {FooterComponent} from "../components/footer/footer.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-moderation-management',
  templateUrl: './moderation-management.page.html',
  styleUrls: ['./moderation-management.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, AdminPanelComponent, FooterComponent, TranslatePipe, RouterLink, IonIcon]
})
export class ModerationManagementPage implements OnInit {
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  public pendingSummaries: any[] = [];
  public loading = true;

  constructor() {
    addIcons({
      checkmarkOutline, closeOutline, trashOutline, eyeOutline
    });
  }

  ngOnInit() {
    this.loadPendingSummaries();
  }

  async loadPendingSummaries() {
    this.loading = true;
    try {
      const q = query(collection(this.firestore, 'summaries'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const summaries = snap.docs.map(d => ({ id: d.id, ...d.data()}));

      this.pendingSummaries = await Promise.all(summaries.map(async (s:any) => {
        const bookSnap = await getDoc(doc(this.firestore, 'books', s.bookId));
        return {
          ...s,
          bookTitle: bookSnap.exists() ? bookSnap.data()['title'] : 'Libro no encontrado'
        };
      }));
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  }

  async approveSummary(summary: any) {
    if (!summary || confirm(this.translate.instant('MODERATION.CONFIRM_APPROVE'))) {
      await updateDoc(doc(this.firestore, 'summaries', summary.id), {
        status: 'published',
        updatedAt: new Date().toISOString()
      });

      await this.createNotification(
        summary.userId,
        this.translate.instant('NOTIFICATIONS.SUMMARY_APPROVED'),
        this.translate.instant('NOTIFICATIONS.MSG_APPROVED', { book: summary.bookTitle }),
        summary.id
      );

      this.pendingSummaries = this.pendingSummaries.filter(s => s.id !== summary.id);
    }
  }

  async rejectSummary(summary: any) {
    const reason = prompt("Indique el motivo del rechazo: ");
    if (reason === null) return;

    if (confirm(this.translate.instant('MODERATION.CONFIRM_REJECT'))) {
      await updateDoc(doc(this.firestore, 'summaries', summary.id), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });

      await this.createNotification(
        summary.userId,
        this.translate.instant('NOTIFICATIONS.SUMMARY_REJECTED'),
        this.translate.instant('NOTIFICATIONS.MSG_REJECTED', { book: summary.bookTitle, reason: reason }),
        summary.id
      );

      this.pendingSummaries = this.pendingSummaries.filter(s => s.id !== summary.id);
    }
  }

  private async createNotification(userId: string, title: string, message: string, refId: string) {
    await addDoc(collection(this.firestore, 'notifications'), {
      userId: userId,
      title: title,
      message: message,
      refId: refId,
      read: false,
      createdAt: new Date().toISOString()
    });
  }
}
