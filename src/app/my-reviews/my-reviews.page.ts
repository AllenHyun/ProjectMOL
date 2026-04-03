import {Component, inject, NgZone, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  where
} from "@angular/fire/firestore";
import {Auth, onAuthStateChanged} from "@angular/fire/auth";
import {Review} from "../models/review";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {addIcons} from "ionicons";
import {trashOutline, star, starOutline} from "ionicons/icons";
import {Router} from "@angular/router";

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.page.html',
  styleUrls: ['./my-reviews.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, TranslatePipe, IonIcon, IonModal]
})
export class MyReviewsPage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);
  private zone = inject(NgZone);

  myFullReviews : any[] = [];

  public books: any[] = [];
  public showModal = false;
  public reviewProsInput = '';
  public reviewConsInput = '';
  public newReview = {
    bookId: '',
    rating: 0,
    text: ''
  };

  constructor() {
    addIcons({
      trashOutline, star, starOutline
    })
  }

  async ngOnInit() {
    this.loadBooks();
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.fetchData(user.uid);
      } else {
        console.log("No hay usuario logueado");
      }
    });
  }

  loadBooks() {
    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, {idField: 'id'}).subscribe(data => {
      this.books = data;
    });
  }

  async saveReview() {
    const user = this.auth.currentUser;
    if (!user || !this.newReview.bookId) {
      const alert = await this.alertCtrl.create({
        header: 'Atención',
        message: 'Inicia sesión para subir tu reseña',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Login',
            handler: () => {
              this.zone.run(() => {
                this.router.navigate(['/login']);
              });
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    try {
      const reviewRef = collection(this.firestore, 'reviews');
      const prosArray = this.reviewProsInput.split(',').map(s => s.trim()).filter(t => t);
      const consArray = this.reviewConsInput.split(',').map(s => s.trim()).filter(t => t);

      await addDoc(reviewRef, {
        bookId: this.newReview.bookId,
        userId: user.uid,
        userName: user.displayName || 'Anónimo',
        rating: this.newReview.rating,
        text: this.newReview.text,
        pros: prosArray,
        cons: consArray,
        createdAt: new Date().toISOString()
      });

      this.showModal = false;
      this.resetForm();
      await this.fetchData(user.uid);
    } catch (error) {
      console.error("Error al crear reseña:", error);
    }
  }

  resetForm(){
    this.newReview = { bookId:'', rating: 0, text: ''};
    this.reviewProsInput = '';
    this.reviewConsInput = '';
  }


  async fetchData(uid: string) {
    try {
      const q = query(collection(this.firestore, 'reviews'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      const reviewList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));

      this.myFullReviews = await Promise.all(reviewList.map(async (rev) => {
        const bookSnap = await getDoc(doc(this.firestore, 'books', rev.bookId));
        const bookData = bookSnap.data();
        return {
          ...rev, bookTitle: bookData ? bookData['title'] : 'Libro no encontrado', bookAuthor: bookData ? bookData['authors'].join(', ') : '---'
        };
      }));
    } catch (e) {
      console.error("Error cargando datos:", e);
    }
  }

  async deleteReview(reviewId: string) {
    if (confirm("¿Está seguro de eliminar esta reseña")){
      await deleteDoc(doc(this.firestore, 'reviews', reviewId));
      this.myFullReviews = this.myFullReviews.filter(review => review.id !== reviewId);
    }
  }
}
