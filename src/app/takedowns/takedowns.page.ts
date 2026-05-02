import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {addIcons} from "ionicons";
import {checkmarkOutline, closeOutline, trashOutline, chevronBackOutline, chevronForwardOutline} from "ionicons/icons";
import {collection, collectionData, deleteDoc, doc, Firestore, getDoc, updateDoc} from "@angular/fire/firestore";
import {async, BehaviorSubject, map, Subscription, switchMap} from "rxjs";
import {data} from "autoprefixer";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {HeaderComponent} from "../components/header/header.component";

@Component({
  selector: 'app-takedowns',
  templateUrl: './takedowns.page.html',
  styleUrls: ['./takedowns.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, IonIcon, AdminPanelComponent, HeaderComponent]
})
export class TakedownsPage implements OnInit {
  private firestore = inject(Firestore);

  public filter$ = new BehaviorSubject<'all' | 'open' | 'resolved' | 'dismissed'>('open');
  private sub: Subscription | null = null;
  public reports: any[] = [];

  constructor() {
    addIcons({
      checkmarkOutline,
      chevronForwardOutline,
      chevronBackOutline,
      closeOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.sub = this.filter$.pipe(
      switchMap(status => {
        const ref = collection(this.firestore, 'reports');
        return collectionData(ref, {idField: 'id'}).pipe(
          map(list => {
            return status === 'all'
            ? list
              : list.filter((r:any) => r.status === status);
          })
        );
      })
    ).subscribe(async (data) => {
      this.reports = await Promise.all(data.map(async (r: any) => {
        const userSnap = await getDoc(doc(this.firestore, `users/${r.reporterId}`));
        const contentSnap = await getDoc(doc(this.firestore, r.refPath));

        return {
          ...r,
          displayId: `TKD-${r.id.substring(0, 3).toUpperCase()}`,
          claimantName: userSnap.exists() ? userSnap.data()['username'] : 'Usuario externo',
          workTitle: contentSnap.exists() ? (contentSnap.data()['bookTitle'] || contentSnap.data()['title']) : 'Contenido eliminado'
        };
      }));
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async updateStatus(reportId: string, newStatus: 'resolved' | 'dismissed') {
    const ref = doc(this.firestore, `reports/${reportId}`);
    await updateDoc(ref, { status: newStatus });
  }

  async deleteReport(reportId: string) {
    if (confirm('¿Eliminar este registro de reporte permanentemente?')) {
      await deleteDoc(doc(this.firestore, `reports/${reportId}`));
    }
  }

  setFilter(status: 'all' | 'open' | 'resolved' | 'dismissed') {
    this.filter$.next(status);
  }

}
