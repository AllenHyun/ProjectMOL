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
  updateDoc, setDoc, arrayUnion, arrayRemove, deleteDoc
} from '@angular/fire/firestore';
import {AlertController, IonContent, IonIcon, IonModal} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, playOutline, thumbsUp, thumbsDown, arrowBackOutline, addOutline, checkmarkCircle, trashOutline, chatbubbleOutline } from 'ionicons/icons';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import { FormsModule } from '@angular/forms';
import {Summary} from '../models/summary';
import {Auth} from "@angular/fire/auth";
import { Review } from '../models/review';
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Vote} from "../models/vote";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

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

  public showListModal = false;
  public userLists: any[] = [];
  public newListName = '';

  private currentAudio: HTMLAudioElement | null = null;
  private readonly langMap: {[key: string]: string} = {
    'Español': 'es-ES',
    'Inglés': 'en-US',
    'Francés': 'fr-FR',
  };

  public commentsMap: {[key: string]: any[]} = {};
  public showComments: {[key: string]: boolean} = {};
  public nextComment: {[key: string]: string} = {};


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
      star, starOutline, playOutline, thumbsUp, thumbsDown, arrowBackOutline, addOutline, checkmarkCircle, trashOutline, chatbubbleOutline });
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
      }
    } catch (error) {}
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

  async saveSummaries(status: 'draft' | 'pending'){
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
        authorId: user?.displayName || user?.email || this.translate.instant('COMMON.ANONYMOUS'),
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
      alert(this.translate.instant('MODERATION.SENDING'));
    } catch (error) {}
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
        userName: user.displayName || user.email || this.translate.instant('COMMON.ANONYMOUS'),
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
    } catch (error) {}
  }

  loadMoreSummaries(){
    this.summaryLimit += 5;
  }

  cancelSummary(){
    const content = this.newSummary.content.trim();

    if (content.length > 0) {
      if (confirm(this.translate.instant('BOOK-D.CANCEL_MESSAGE'))){
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
    } catch (error) {}
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
    const apiKey = environment.elevenLabsKey;
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

  async openAddToListModal(){
    const user = this.auth.currentUser;
    if (!user){
      this.showLoginAlert();
      return;
    }
    this.showListModal = true;
    this.loadUserLists(user.uid);
  }

  loadUserLists(userId: string){
    const listRef = collection(this.firestore, 'lists');
    const q = query(listRef, where('userId', '==', userId));

    collectionData(q, {idField: 'id'}).subscribe(data => {
      if(data.length === 0){
        this.createDefaultList(userId);
      } else {
        this.userLists = data;
      }
    });
  }

  private async createDefaultList(userId: string) {
    const defaultNames = [
      this.translate.instant('MY_LISTS.DEFAULTS.TO_READ'),
      this.translate.instant('MY_LISTS.DEFAULTS.IN_PROGRESS'),
      this.translate.instant('MY_LISTS.DEFAULTS.READ'),
      this.translate.instant('MY_LISTS.DEFAULTS.FAVORITES')
    ];

    try {
      const listRef = collection(this.firestore, 'lists');
      const promises = defaultNames.map((name) =>
        addDoc(listRef, {
          name: name,
          userId: userId,
          bookIds: [],
          createdAt: new Date().toISOString()
        }));
      await Promise.all(promises);
    } catch (error) {}
  }

  async toggleBookListModal(list: any){
    const listRef = doc(this.firestore, 'lists', list.id);
    const isInList = list.bookIds?.includes(this.book.id);

    try {
      await updateDoc(listRef, {
        bookIds: isInList ? arrayRemove(this.book.id) : arrayUnion(this.book.id)
      });
    } catch (error) {}
  }

  async createAndAddToList(){
    const user = this.auth.currentUser;
    if (!this.newListName.trim() || !user){
      return;
    }

    try{
      const listRef = collection(this.firestore, 'lists');
      await addDoc(listRef, {
        name: this.newListName.trim(),
        userId: user.uid,
        bookIds: [this.book.id],
        createdAt: new Date().toISOString()
      });
      this.newListName = '';
    }
    catch (error) {}
  }

  async showLoginAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('BOOK-D.SAVE_REVIEW.HEADER'),
      message: this.translate.instant('BOOK-D.SAVE_REVIEW.MESSAGE'),
      buttons: [
        { text: this.translate.instant('BOOK-D.SAVE_REVIEW.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('BOOK-D.SAVE_REVIEW.LOGIN'),
          handler: () => this.router.navigate(['/login'])
        }
      ]
    });
    await alert.present();
  }

  async deleteList(listId: string){
    const confirmation = confirm(this.translate.instant('MY_LISTS.CONFIRM_DELETE'));
    if (confirmation){
      try{
        const listRef = doc(this.firestore, 'lists', listId);
        await deleteDoc(listRef);
      } catch (error) {}
    }
  }

  toggleComments(reviewId: string){
    this.showComments[reviewId] = !this.showComments[reviewId];
    if (this.showComments[reviewId] && !this.commentsMap[reviewId]){
      this.loadComments(reviewId);
    }
  }

  loadComments(reviewId: string){
    const commentsRef = collection(this.firestore, 'review_comments');
    const q = query(commentsRef, where('reviewId', '==', reviewId));

    collectionData(q, {idField: 'id'}).subscribe(data => {
      this.commentsMap[reviewId] = data.sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }

  async postComment(reviewId: string){
    const user = this.auth.currentUser;
    const text = this.nextComment[reviewId]?.trim();

    if(!user || !text){
      return;
    }

    try {
      const commentRef = collection(this.firestore, 'review_comments');
      await addDoc(commentRef, {
        reviewId: reviewId,
        userId: user.uid,
        userName: user.displayName || user.email || this.translate.instant('COMMON.ANONYMOUS'),
        text: text,
        createdAt: new Date().toISOString()
      });

      this.nextComment[reviewId] = '';
      if (!this.showComments[reviewId]){
        this.toggleComments(reviewId);
      }
    } catch (error) {}
  }
}
