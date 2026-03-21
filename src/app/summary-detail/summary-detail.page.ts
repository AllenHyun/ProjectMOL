import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import {ActivatedRoute} from "@angular/router";
import {doc, Firestore, getDoc} from "@angular/fire/firestore";
import {Summary} from "../models/summary";
import { star, starOutline, playOutline, bookmarkOutline, shareOutline, flagOutline, thumbsUpOutline, thumbsDownOutline } from 'ionicons/icons';
import {addIcons} from "ionicons";

@Component({
  selector: 'app-summary-detail',
  templateUrl: './summary-detail.page.html',
  styleUrls: ['./summary-detail.page.scss'],
  standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonIcon, IonModal]
})
export class SummaryDetailPage implements OnInit {

  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  public book: any = null;
  public summary: Summary | null = null;

  constructor() {
    addIcons({
      star,
      starOutline,
      playOutline,
      bookmarkOutline,
      shareOutline,
      flagOutline,
      thumbsUpOutline,
      thumbsDownOutline
    });
  }

  async ngOnInit() {
    const summaryId = this.route.snapshot.paramMap.get('id')?.trim();

    if (summaryId) {
      try {
        const summaryRef = doc(this.firestore, 'summaries', summaryId);
        const summarySnap = await getDoc(summaryRef);

        if (summarySnap.exists()) {
          this.summary = {id: summarySnap.id, ...summarySnap.data()} as Summary;

          await this.loadBookInfo(this.summary.bookId);

          console.log("Resumen y libros cargados: ", this.summary, this.book);
        } else{
          console.error("No se encontró el resumen");
        }
      } catch (error) {
        console.error("Error al cargar el detalle: ", error);
      }
    }
  }

  private async loadBookInfo(bookId: string) {
    try {
      const bookRef = doc(this.firestore, 'books', bookId);
      const bookSnap = await getDoc(bookRef);

      if (bookSnap.exists()) {
        this.book = bookSnap.data();
      }
    } catch (error) {
      console.error("Error al cargar libro: ", error);
    }
  }



}
