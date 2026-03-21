import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {Firestore, doc, getDoc, collection, query, where, collectionData, addDoc} from '@angular/fire/firestore';
import {IonContent, IonIcon, IonModal} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, playOutline } from 'ionicons/icons';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import { FormsModule } from '@angular/forms';
import {Summary} from '../models/summary';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.page.html',
  standalone: true,
  imports: [IonContent, CommonModule, HeaderComponent, FooterComponent, IonIcon, HeaderComponent, FooterComponent, IonModal, FormsModule]
})
export class BookDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);

  public book: any = null;

  public summaries: Summary[] = [];
  public showModal = false;
  public expandedSummaries: {[key: string]: boolean} = {};

  public newSummary = {
    userName: '',
    content: ''
  };

  constructor() {
    addIcons({ star, starOutline, playOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')?.trim();

    if (id) {
      try {
        const bookDocRef = doc(this.firestore, 'books', id);
        const snap = await getDoc(bookDocRef);

        if (snap.exists()) {
          this.book = snap.data();
          this.book.id = id;
          this.getSummaries(id);
          console.log("Datos cargados correctamente:", this.book);
        } else {
          console.error("No se encontró el documento en Firebase con ID:", id);
        }
      } catch (error) {
        console.error("Error al obtener el libro:", error);
      }
    }
  }

  getSummaries(bookId: string){
    const resRef = collection(this.firestore, 'summaries');
    const q = query(resRef, where('bookId', '==', bookId));
    collectionData(q, {idField: 'id'}).subscribe(data=> {
      this.summaries = data as unknown as Summary[];
    });
  }

  async saveSummaries(){
    if (!this.newSummary.userName || !this.newSummary.content) {
      return;
    }

    try {
      const summaryRef = collection(this.firestore, 'summaries');
      await addDoc(summaryRef, {
        bookId: this.book.id,
        authorId: this.newSummary.userName,
        structure: {
          tldr: this.newSummary.content,
          keyPoints: [],
          sections: []
        },
        status: 'published',
        wordCount: this.newSummary.content.split(' ').length,
        createdAt: new Date().toISOString(),
        updateAt: new Date().toISOString()
      });

      this.showModal = false;
      this.newSummary = {userName: '', content: ''};

      console.log("Resumen guardado con éxito");

    } catch (error) {
      console.error("Error al guardar el resumen: ", error);
    }
  }

  toggleSummary(id: string){
    this.expandedSummaries[id] = !this.expandedSummaries[id];
  }
}
