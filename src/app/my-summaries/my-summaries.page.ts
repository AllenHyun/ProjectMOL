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
  updateDoc,
  where
} from "@angular/fire/firestore";
import {Auth, onAuthStateChanged, user} from "@angular/fire/auth";
import {addIcons} from "ionicons";
import {trashOutline, documentTextOutline, createOutline} from "ionicons/icons";
import {async} from "rxjs";
import {Summary} from "../models/summary";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-my-summaries',
  templateUrl: './my-summaries.page.html',
  styleUrls: ['./my-summaries.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, TranslatePipe, IonIcon, RouterLink, IonModal]
})
export class MySummariesPage implements OnInit {
  private firestore = inject(Firestore);
  public auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private zone = inject(NgZone);

  public activeTab: 'draft' | 'pending' | 'published' | 'rejected' = 'draft';
  public tabs: ('draft' | 'pending' | 'published' | 'rejected')[] = ['draft', 'pending', 'published', 'rejected'];
  public allSummaries: any[] = [];
  public loading = true;

  public showEditModal = false;
  public editingSummary: any = null;
  public editContent: string = '';
  public originalContent = '';

  public showCreateModal = false;
  public books: any[] = [];
  public newSummary = {
    bookId: '',
    content: ''
  };

  private translate = inject(TranslateService);

  constructor() {
    addIcons({
      trashOutline, documentTextOutline, createOutline
    });
  }

  ngOnInit() {
    this.loadBooks();
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.loadSummaries(user.uid);
      }
      this.loading = false;
    })
  }

  async loadSummaries(uid: string){
    try{
      const q = query(collection(this.firestore, 'summaries'), where('userId', '==', uid));
      const querySnapshot = await getDocs(q);

      const rawSummaries = querySnapshot.docs.map(d => ({id: d.id, ...d.data()} as Summary));

      this.allSummaries = await Promise.all(rawSummaries.map(async (sum) => {
        const bookSnap = await getDoc(doc(this.firestore, 'books', sum.bookId));
        const bookData = bookSnap.data();
        return {
          ...sum,
          bookTitle: bookData ? bookData['title'] : 'Libro no encontrado',
          bookAuthor: bookData ? bookData['authors']?.join(', ') : '---'
        };
      }));
    } catch (error) {
      console.error("Error cargando resúmenes: ", error);
    }
  }

  get filteredSummaries() {
    if (this.activeTab === 'pending') {
      return this.allSummaries.filter(s => s.status === 'published' || s.status === 'pending');
    }
    return this.allSummaries.filter(s => s.status === this.activeTab);
  }

  async deleteSummary(id: string){
    const msg = this.translate.instant('SUMMARIES.CONFIRM.DELETE');
    if (confirm(msg)){
      await deleteDoc(doc(this.firestore, 'summaries', id));
      this.allSummaries = this.allSummaries.filter(s => s.id !== id);
    }
  }

  openEdit(sum:any){
    this.editingSummary = sum;
    this.editContent = sum.structure.tldr;
    this.originalContent = sum.structure.tldr;
    this.showEditModal = true;
  }

  async updateSummary(newStatus: 'draft' | 'published'){
    if (!this.editingSummary || !this.editContent.trim()){
      return;
    }

    try {
      const summaryRef = doc(this.firestore, 'summaries', this.editingSummary.id);

      const updatedData = {
        'structure.tldr': this.editContent,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        wordCount: this.editContent.split(/\s+/).length
      };

      await  updateDoc(summaryRef, updatedData);

      const index = this.allSummaries.findIndex(s => s.id === this.editingSummary.id);

      if (index !== -1){
        this.allSummaries[index].structure.tldr = this.editContent;
        this.allSummaries[index].status = newStatus;
        this.allSummaries[index].updatedAt = updatedData.updatedAt;
        this.allSummaries[index].wordCount = updatedData.wordCount;
      }

      this.showEditModal = false;
      this.editingSummary = null;
      console.log("Resumen actualizado");
    } catch (error) {
      console.log("Error al actualizar: ", error);
    }
  }

  cancelEdit(){
    if(this.editContent.trim() !== this.originalContent){
      const msg = this.translate.instant('SUMMARIES.CONFIRM.SAVE_CHANGES');
      if (confirm(msg)){
        this.updateSummary('draft');
      } else {
        this.showEditModal = false;
      }
    } else {
      this.showEditModal = false;
    }
  }

  loadBooks(){
    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, {idField: 'id'}).subscribe(data =>{
      this.books = data;
    });
  }

  async saveNewSummary(status: 'draft' | 'published') {
    const user = this.auth.currentUser;
    if (!user || !this.newSummary.bookId || !this.newSummary.content.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Atención',
        message: 'Inicia sesión para subir tu resumen',
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
      const summaryRef = collection(this.firestore, 'summaries');
      await addDoc(summaryRef, {
        bookId: this.newSummary.bookId,
        authorId: user.displayName || user.email || 'Anónimo',
        userId: user.uid,
        structure: {
          tldr: this.newSummary.content,
          keyPoints: [],
          sections: []
        },
        status: status,
        wordCount: this.newSummary.content.split(/\s+/).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      this.showCreateModal = false;
      this.newSummary = { bookId: '', content: '' };
      await this.loadSummaries(user.uid);

    } catch (error) {
      console.error("Error al crear resumen:", error);
    }
  }

  cancelNewSummary(){
    const content = this.newSummary.content.trim();
    if (content.length > 0) {
      const msg = this.translate.instant('SUMMARIES.CONFIRM.EXIT_DRAFT');
      if (confirm(msg)){
        this.saveNewSummary('draft');
      } else {
        this.showCreateModal = false;
        this.newSummary.content = '';
      }
    } else {
      this.showCreateModal = false;
    }
  }


}
