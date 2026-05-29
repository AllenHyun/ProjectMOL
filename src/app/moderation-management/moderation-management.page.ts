import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, trashOutline, eyeOutline, book} from "ionicons/icons";
import {addDoc, collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where} from "@angular/fire/firestore";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HeaderComponent} from "../components/header/header.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {FooterComponent} from "../components/footer/footer.component";
import {Router, RouterLink} from "@angular/router";
import {ModerationSummary} from "../models/summary";
import {Book} from "../models/book";
import {Notifications} from "../models/notifications";

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
  private router = inject(Router);

  public pendingSummaries: ModerationSummary[] = [];
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

      const summaries = snap.docs.map(d => ({ ...d.data(), id: d.id })) as ModerationSummary[];

      this.pendingSummaries = await Promise.all(summaries.map(async (s: ModerationSummary) => {
        if (!s.bookId) {
          return { ...s, bookTitle: this.translate.instant('MODERATION.BOOK_NOT_FOUND') };
        }

        const bookSnap = await getDoc(doc(this.firestore, 'books', s.bookId));
        const bookData = bookSnap.data() as Book;

        return {
          ...s,
          id: s.id,
          bookTitle: bookSnap.exists() ? bookData.title : this.translate.instant('MODERATION.BOOK_NOT_FOUND')
        };
      }));
    } catch (error) {
      console.error("Error al cargar resúmenes pendientes: ", error);
    } finally {
      this.loading = false;
    }
  }

  async approveSummary(summary: any) {
    if (confirm(this.translate.instant('MODERATION.CONFIRM_APPROVE'))) {
      try {
        await updateDoc(doc(this.firestore, 'summaries', summary.id), {
          status: 'published',
          updatedAt: new Date().toISOString()
        });

        const targetUser = summary.userId || summary.authorId || '';

        if (targetUser){
          await this.createNotification(
            targetUser,
            this.translate.instant('NOTIFICATIONS.SUMMARY_APPROVED'),
            this.translate.instant('NOTIFICATIONS.MSG_APPROVED', { book: summary.bookTitle }),
            summary.id
          );
        }

        this.pendingSummaries = this.pendingSummaries.filter(s => s.id !== summary.id);
      } catch (error) {
        console.error("Error al aprobar el resumen: ", error);
      }
    }
  }

  async rejectSummary(summary: any) {
    const reason = prompt("Indique el motivo del rechazo: ");
    if (reason === null) return;

    if (confirm(this.translate.instant('MODERATION.CONFIRM_REJECT'))) {
      try {
        await updateDoc(doc(this.firestore, 'summaries', summary.id), {
          status: 'rejected',
          updatedAt: new Date().toISOString()
        });

        const targetUser = summary.userId || summary.authorId || '';

        if (targetUser) {
          await this.createNotification(
            targetUser,
            this.translate.instant('NOTIFICATIONS.SUMMARY_REJECTED'),
            this.translate.instant('NOTIFICATIONS.MSG_REJECTED', { book: summary.bookTitle, reason: reason }),
            summary.id
          );
        }

        this.pendingSummaries = this.pendingSummaries.filter(s => s.id !== summary.id);
      } catch (error) {
        console.error("Error al rechazar el resumen: ", error);
      }
    }
  }

  private async createNotification(userId: string, title: string, message: string, refId: string) {
    const notificationData: Notifications = {
      userId: userId,
      title: title,
      message: message,
      refId: refId,
      read: false,
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(this.firestore, 'notifications'), notificationData);
  }

  navigateToDetail(summaryId: string | undefined) {
    if (!summaryId) {
      console.error("No se puede navegar: El ID del resumen viene vacío o undefined.");
      alert("Error: El resumen seleccionado no contiene un identificador válido.");
      return;
    }
    this.router.navigate(['/summary-detail', summaryId]);
  }
}
