import {Component, OnInit, inject, NgZone} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  collectionData,
  addDoc,
  updateDoc, setDoc
} from '@angular/fire/firestore';
import {AlertController, IonContent, IonIcon, IonModal} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, playOutline, thumbsUp, thumbsDown, arrowBackOutline } from 'ionicons/icons';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import { FormsModule } from '@angular/forms';
import {Summary} from '../models/summary';
import {Auth} from "@angular/fire/auth";
import { Review } from '../models/review';
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Vote} from "../models/vote";
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.page.html',
  standalone: true,
  imports: [IonContent, CommonModule, HeaderComponent, FooterComponent, IonIcon, HeaderComponent, FooterComponent, IonModal, FormsModule, RouterLink, TranslatePipe]
})
export class BookDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);
  private zone = inject(NgZone);
  private http = inject(HttpClient);

  public book: any = null;

  public summaries: Summary[] = [];
  public showModal = false;
  public expandedSummaries: {[key: string]: boolean} = {};
  public summaryLimit = 5;
  public auth = inject(Auth);

  public reviews: Review[] = [];
  public showReviewModal = false;
  public reviewProsInput = '';
  public reviewConsInput = '';
  public newReview = {
    rating: 0,
    text: ''
  };

  public newSummary = {
    content: ''
  };

  public showAllReviews = false;

  public userVote: number | null = null;

  private currentAudio: HTMLAudioElement | null = null;
  private readonly langMap: {[key: string]: string} = {
    'Español': 'es-ES',
    'Inglés': 'en-US',
    'Francés': 'fr-FR',
  };


  get visibleReviews(): Review[] {
    const sortedReviews = [...this.reviews].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return this.showAllReviews ? sortedReviews: sortedReviews.slice(0,3);
  }

  get visibleSummaries(): Summary[] {
    const sorted = [...this.summaries].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return this.summaries.slice(0, this.summaryLimit);
  }

  constructor() {
    addIcons( {
      star, starOutline, playOutline, thumbsUp, thumbsDown, arrowBackOutline });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')?.trim();
      if (id) {
        this.loadData(id);
      }
    });
  }

  async loadData(id: string) {
    try {
      const bookDocRef = doc(this.firestore, 'books', id);
      const snap = await getDoc(bookDocRef);

      if (snap.exists()) {
        this.book = snap.data();
        this.book.id = id;
        this.getSummaries(id);
        this.getReviews(id);
        this.checkUserVote(id);
        console.log("Datos cargados correctamente:", this.book);
      } else {
        console.error("No se encontró el documento en Firebase con ID:", id);
      }
    } catch (error) {
      console.error("Error al obtener el libro:", error);
    }
  }

  getReviews(bookId: string) {
    const revRef = collection(this.firestore, 'reviews');
    const q = query(revRef, where('bookId', '==', bookId));
    collectionData(q, {idField: 'id'}).subscribe(data => {
      this.reviews = data as unknown as Review[];
    });
  }

  getSummaries(bookId: string){
    const resRef = collection(this.firestore, 'summaries');
    const q = query(resRef, where('bookId', '==', bookId), where('status', '==', 'published'));
    collectionData(q, {idField: 'id'}).subscribe(data=> {
      this.summaries = data as unknown as Summary[];
    });
  }

  async saveSummaries(status: 'draft' | 'published'){
    const user = this.auth.currentUser;
    if (!user) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('BOOK-D.SAVE_SUMMARY.HEADER'),
        message: this.translate.instant('BOOK-D.SAVE_SUMMARY.MESSAGE'),
        buttons: [
          {
            text: this.translate.instant('BOOK-D.SAVE_SUMMARY.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('BOOK-D.SAVE_SUMMARY.LOGIN'),
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
    if (!this.newSummary.content) {
      return;
    }

    try {
      const summaryRef = collection(this.firestore, 'summaries');
      await addDoc(summaryRef, {
        bookId: this.book.id,
        authorId: user?.displayName || user?.email || 'Anónimo',
        userId: user?.uid,
        structure: {
          tldr: this.newSummary.content,
          keyPoints: [],
          sections: []
        },
        status: status,
        wordCount: this.newSummary.content.split(' ').length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      this.showModal = false;
      this.newSummary.content = '';

      console.log("Resumen guardado con éxito");

    } catch (error) {
      console.error("Error al guardar el resumen: ", error);
    }
  }

  toggleSummary(id: string){
    this.expandedSummaries[id] = !this.expandedSummaries[id];
  }

  async saveReview(){
    const user = this.auth.currentUser;
    if (!user) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('BOOK-D.SAVE_REVIEW.HEADER'),
        message: this.translate.instant('BOOK-D.SAVE_REVIEW.MESSAGE'),
        buttons: [
          {
            text: this.translate.instant('BOOK-D.SAVE_REVIEW.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('BOOK-D.SAVE_REVIEW.LOGIN'),
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
    try{
      const reviewRef = collection(this.firestore, 'reviews');

      const prosArray = this.reviewProsInput ? this.reviewProsInput.split(',').map(s => s.trim()).filter(t => t !== '') : [];
      const consArray = this.reviewConsInput ? this.reviewConsInput.split(',').map(s => s.trim()).filter(t => t !== '') : [];

      await addDoc(reviewRef, {
        bookId: this.book.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anónimo',
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

  loadMoreSummaries(){
    this.summaryLimit += 5;
  }

  cancelSummary(){
    const content = this.newSummary.content.trim();

    if (content.length > 0) {
      if (confirm(this.translate.instant('BOOK-D.SAVE_SUMMARY.CANCEL_MESSAGE'))){
        this.saveSummaries('draft');
      } else{
        this.showModal = false;
        this.newSummary.content = '';
      }
    } else {
      this.showModal = false;
    }
  }

  async rateBook(value: number){
    const user = this.auth.currentUser;

    if (!user || !this.book){
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('BOOK-D.VOTE.HEADER'),
        message: this.translate.instant('BOOK-D.VOTE.MESSAGE'),
        buttons: [
          {
            text: this.translate.instant('BOOK-D.VOTE.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('BOOK-D.VOTE.LOGIN'),
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

    if(this.userVote === value){
      return;
    }

    const voteId = `${user.uid}_${this.book.id}`;
    const voteRef = doc(this.firestore, 'bookVotes', voteId);

    let currentCount = this.book.ratingCount || 0;
    let currentAvg = this.book.ratingAvg || 0;
    let newCount = currentCount;
    let newAvg = currentAvg;

    if (this.userVote === null){
      newCount = currentCount + 1;
      newAvg = ((currentAvg*currentCount)+value)/newCount;
    } else{
      newAvg = ((currentAvg*currentCount)-this.userVote + value)/currentCount;
    }

    try {
      await setDoc(voteRef, {
        userId: user.uid,
        bookId: this.book.id,
        value: value,
        updatedAt: new Date().toISOString()
      });
      const bookRef = doc(this.firestore, 'books', this.book.id);
      await updateDoc(bookRef, {
        ratingCount: newCount,
        ratingAvg: newAvg,
      });

      this.book.ratingCount = newCount;
      this.book.ratingAvg = newAvg;
      this.userVote = value;
      console.log('Valoración actualizada con éxito');
    } catch (error) {
      console.error("Error al actualizar la valoración: ", error);
    }
  }

  async checkUserVote(bookId: string){
    const user = this.auth.currentUser;
    if(!user){
      return;
    }

    const voteId = `${user.uid}_${bookId}`;
    const voteRef = doc(this.firestore, 'booksVotes', voteId);
    const voteSnap = await getDoc(voteRef)

    if (voteSnap.exists()){
      const data = voteSnap.data() as Vote;
      this.userVote = data.value;
    }
  }


  async speakSummary(text: string, langName: string = 'Español') {
    if (this.currentAudio || window.speechSynthesis.speaking) {
      this.currentAudio?.pause();
      this.currentAudio = null;
      window.speechSynthesis.cancel();
      return;
    }

    const voiceId = 'pNInz6obpgDQGcFmaJgB';
    const apiKey = 'sk_bb2a3b445d40574eef916254807491c163e478862cac2b36';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const body = {
      text: text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8
      }
    };

    const headers = {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    };

    this.http.post(url, body, { headers: headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const audioUrl = URL.createObjectURL(blob);
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.play();
        this.currentAudio.onended = () => {
          this.currentAudio = null;
        };
      },
      error: (error) => {
        this.currentAudio = null;
        this.useSystemSpeechFallback(text, langName);
      }
    });
  }

  private useSystemSpeechFallback(text: string, langName: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.langMap[langName] || 'es-ES';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

}
