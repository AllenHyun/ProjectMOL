import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, trashOutline, chevronBackOutline, chevronForwardOutline, eyeOutline} from "ionicons/icons";
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  updateDoc
} from "@angular/fire/firestore";
import {async, BehaviorSubject, map, Subscription, switchMap} from "rxjs";
import {data} from "autoprefixer";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {HeaderComponent} from "../components/header/header.component";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-takedowns',
  templateUrl: './takedowns.page.html',
  styleUrls: ['./takedowns.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, IonIcon, AdminPanelComponent, HeaderComponent, IonModal]
})
export class TakedownsPage implements OnInit {
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  public filter$ = new BehaviorSubject<'all' | 'open' | 'resolved' | 'dismissed'>('open');
  private sub: Subscription | null = null;
  public reports: any[] = [];

  public selectedReportContent: any = null;
  public isPreviewOpen = false;

  constructor() {
    addIcons({
      checkmarkOutline,
      chevronForwardOutline,
      chevronBackOutline,
      closeOutline,
      trashOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.sub = this.filter$.pipe(
      switchMap(status => {
        const ref = collection(this.firestore, 'reports');
        return collectionData(ref, { idField: 'id' }).pipe(
          map(list => status === 'all' ? list : list.filter((r: any) => r.status === status))
        );
      })
    ).subscribe(async (data) => {
      this.reports = await Promise.all(data.map(async (r: any) => {
        let claimant = r.reporterName || 'Anónimo';
        if (r.reporterId && r.reporterId !== 'Anónimo') {
          const userSnap = await getDoc(doc(this.firestore, `users/${r.reporterId}`));
          if (userSnap.exists()) claimant = userSnap.data()['username'];
        }

        let title = r.workTitle;
        if (!title) {
          const contentSnap = await getDoc(doc(this.firestore, r.refPath));
          if (contentSnap.exists()) {
            const cData = contentSnap.data();
            title = cData['bookTitle'] || cData['title'] || 'Contenido';
          } else {
            title = 'Contenido eliminado';
          }
        }

        return { ...r, claimantName: claimant, workTitle: title, displayId: `TKD-${r.id.substring(0, 3).toUpperCase()}` };
      }));
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async updateStatus(report: any, newStatus: 'resolved' | 'dismissed') {
    try {
      const ref = doc(this.firestore, `reports/${report.id}`);
      await updateDoc(ref, {status: newStatus});

      const contentRef = doc(this.firestore, report.refPath);
      const contentSnap = await getDoc(doc(this.firestore, report.refPath));

      if (contentSnap.exists()) {
        const contentData = contentSnap.data();
        const  authorId = contentData['userId'];

        let notifTitle = '';
        let notiMsg = '';

        if (newStatus === 'resolved'){
          notifTitle = this.translate.instant('NOTIFICATIONS.REPORT_RESOLVED_TITLE');
          notiMsg = this.translate.instant('NOTIFICATIONS.REPORT_RESOLVED_MSG', {work: report.workTitle});

          await deleteDoc(contentRef);
        } else {
          notifTitle = this.translate.instant('NOTIFICATIONS.REPORT_DISMISSED_TITLE');
          notiMsg = this.translate.instant('NOTIFICATIONS.REPORT_DISMISSED_MSG', {work: report.workTitle});
        }

        await this.createNotification(authorId, notifTitle, notiMsg, report.id);
      }
      alert(this.translate.instant('MODERATION.ACTION_COMPLETED'));
    } catch (error) {
      console.error("Error al actualizar el reporte: ", error);
    }
  }

  private async createNotification(userId: string, title: string, message: string, refId: string) {
    await addDoc(collection(this.firestore, 'notifications'), {
      userId: userId,
      title: title,
      message: message,
      refId: refId,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  async deleteReport(reportId: string) {
    if (confirm('¿Eliminar este registro de reporte permanentemente?')) {
      await deleteDoc(doc(this.firestore, `reports/${reportId}`));
    }
  }

  setFilter(status: 'all' | 'open' | 'resolved' | 'dismissed') {
    this.filter$.next(status);
  }

  async reviewContent(report: any){
    try {
      const contentSnap = await getDoc(doc(this.firestore, report.refPath));
      if (contentSnap.exists()) {
        const data = contentSnap.data();
        this.selectedReportContent = {
          title: report.workTitle,
          text: data['structure']?.tldr || data['text'] || 'Sin texto disponible',
          author: data['userName'] || data['authorName'] || 'Desconocido'
        };
        this.isPreviewOpen = true;
      } else {
        alert("El contenido original ya ha sido eliminado.");
      }
    } catch (error) {
      console.error("Error al actualizar el reporte: ", error);
    }
  }

}
