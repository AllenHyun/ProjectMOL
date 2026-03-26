import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {addDoc, collection, collectionData, doc, Firestore, getDoc, query, where} from "@angular/fire/firestore";
import {Summary} from "../models/summary";
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import {Review} from "../models/review";
import {addIcons} from "ionicons";
import {arrowBackOutline, star, starOutline} from "ionicons/icons";
import {Auth} from "@angular/fire/auth";

@Component({
  selector: 'app-review-detail',
  templateUrl: './review-detail.page.html',
  styleUrls: ['./review-detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonIcon, RouterLink, IonModal]
})
export class ReviewDetailPage implements OnInit {

  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  public book: any = null;
  public reviews: Review[] = [];

  public showReviewModal = false;
  public reviewProsInput = '';
  public reviewConsInput = '';
  public newReview = {
    rating: 0,
    text: ''
  };

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

  async saveReview(){
    const user = this.auth.currentUser;
    if(!user){
      alert("Debes iniciar sesión para comentar");
      return;
    }
    try{
      const reviewRef = collection(this.firestore, 'reviews');

      const prosArray = this.reviewProsInput ? this.reviewProsInput.split(',').map(s => s.trim()).filter(t => t !== '') : [];
      const consArray = this.reviewConsInput ? this.reviewConsInput.split(',').map(s => s.trim()).filter(t => t !== '') : [];

      await addDoc(reviewRef, {
        bookId: this.book.id,
        userId: user.displayName || user.email || 'Anónimo',
        rating: this.newReview.rating,
        text: this.newReview.text,
        pros: prosArray,
        cons: consArray,
        createdAt: new Date().toISOString()
      });
      this.showReviewModal = false;
      this.newReview = {rating: 0, text: ''};
      this.reviewProsInput = '';
      this.reviewConsInput = '';

      console.log("Reseña publicada");
    } catch (error) {
      console.error("Error al guardar la reseña: ", error);
    }
  }
}
