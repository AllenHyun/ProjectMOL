import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {collection, collectionData, doc, Firestore, getDoc, query, where} from "@angular/fire/firestore";
import {Summary} from "../models/summary";
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import {Review} from "../models/review";
import {addIcons} from "ionicons";
import {arrowBackOutline, star, starOutline} from "ionicons/icons";

@Component({
  selector: 'app-review-detail',
  templateUrl: './review-detail.page.html',
  styleUrls: ['./review-detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonIcon, RouterLink]
})
export class ReviewDetailPage implements OnInit {

  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  public book: any = null;
  public reviews: Review[] = [];

  public isLoading = true;

  constructor() {
    addIcons({
      star, starOutline, arrowBackOutline
    });
  }

  async ngOnInit() {
    const bookId = this.route.snapshot.paramMap.get('id');

    if (bookId) {
      try{
        const bookRef = doc(this.firestore, 'books', bookId);
        const snap = await getDoc(bookRef);
        if (snap.exists()){
          this.book = {...snap.data(), id:snap.id};
          this.loadAllReviews(bookId);
        } else{
          console.error('El libro no existe en la base de datos');
          this.isLoading = false;
        }
      } catch (error) {
        console.error("Error cargando reseñas: ", error);
        this.isLoading = false;
      }
    }
  }

  loadAllReviews(bookId: string){
    const revRef = collection(this.firestore, 'reviews');
    const q = query(revRef, where('bookId', '==', bookId));

    collectionData(q, { idField: 'id' }).subscribe({
      next: (data) => {
        this.reviews = (data as Review[]).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error obteniendo reseñas:", err);
        this.isLoading = false;
      }
    });
  }
}
