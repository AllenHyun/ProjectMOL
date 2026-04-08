import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {Book} from "../models/book";
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore, getDoc,
  query,
  updateDoc,
  where,
  getDocs
} from "@angular/fire/firestore";
import {addIcons} from "ionicons";
import {
  searchOutline,
  checkmarkOutline,
  closeOutline,
  trashOutline,
  arrowBackOutline,
  imageOutline,
  brushOutline,
} from "ionicons/icons";
import {RouterLink} from "@angular/router";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-book-management',
  templateUrl: './book-management.page.html',
  styleUrls: ['./book-management.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon, RouterLink, TranslatePipe]
})
export class BookManagementPage implements OnInit {
  private firestore: Firestore = inject(Firestore);
  public book: Book[] = [];
  public showForm = false;
  public emptyBook : any = this.initBook();
  public searchTerms: string = '';
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  public availableCategories = ['Acción', 'Romance', 'Thriller', 'Educativo', 'Aventura', 'Ciencia Ficción'];

  constructor() {
    addIcons({
      searchOutline,
      checkmarkOutline,
      closeOutline,
      trashOutline,
      arrowBackOutline,
      imageOutline,
      brushOutline
    })
  }

  ngOnInit() {
    const booksCollection = collection(this.firestore, 'books');
    collectionData(booksCollection, {idField: 'id'}).subscribe((data) => {
      this.book = data as Book[];
    });
  }

  initBook() {
    return {
      title: '',
      authors: '',
      isbn: '',
      language: 'Español',
      categories: [],
      tags: '',
      level: 'ESO/Bachiller',
      year: new Date().getFullYear(),
      coverUrl: ''
    };
  }


  async addBook() {
    if (!this.emptyBook.title) return;

    try{

      const finalBook: Book = {
        title: this.emptyBook.title,
        isbn: this.emptyBook.isbn || '',
        language: this.emptyBook.language,
        year: Number(this.emptyBook.year),
        coverUrl: this.emptyBook.coverUrl || 'https://via.placeholder.com/150',
        authors: this.emptyBook.authors ? this.emptyBook.authors.split(',').map((e: any) => e.trim()) : [],
        categories: this.emptyBook.categories,
        tags: this.emptyBook.tags ? this.emptyBook.tags.split(',').map((e: any) => e.trim()) : [],
        level: this.emptyBook.level,
        id: Date.now().toString(),
        createdAt: new  Date().toISOString(),
        ratingAvg: 0,
        ratingCount: 0,
        sumaryCount: 0
      };

      if(this.emptyBook.id){
        const  bookDocRef = doc(this.firestore, `books/${this.emptyBook.id}`);
        await updateDoc(bookDocRef, {
          ...finalBook,
          updateAt: new Date().toISOString(),
        });
      } else{
        const booksCollection = collection(this.firestore, 'books');
        await addDoc(booksCollection, {
          ...finalBook,
          createdAt: new Date().toISOString(),
          ratingAvg: 0,
          ratingCount: 0,
          sumaryCount: 0
        });
      }
      this.cancelForm();
    } catch(error) {
      console.log("Error al guardar en Firebase: ", error);
    }
  }

  async deleteBook(id: string) {
    if (confirm(this.translate.instant('BOOK-M.DELETE_CONFIRM'))) {
      try{
        const summariesRef = collection(this.firestore, 'summaries');
        const qSummaries = query(summariesRef, where('bookId', '==', id));
        const sumSnapshot = await getDocs(qSummaries);
        const deleteSummaries = sumSnapshot.docs.map( d => deleteDoc(doc(this.firestore, 'summaries', d.id)));
        await Promise.all(deleteSummaries);
        console.log(`${sumSnapshot.size} resúmenes eliminados`);

        const reviewsRef = collection(this.firestore, 'reviews');
        const qReviews = query(reviewsRef, where('bookId', '==', id));
        const revSnapshot = await getDocs(qReviews);
        const deleteReview = revSnapshot.docs.map( d => deleteDoc(doc(this.firestore, 'reviews', d.id)));
        await Promise.all(deleteReview);
        console.log(`${revSnapshot.size} reseñas eliminadas`);

        const bookDocRef = doc(this.firestore, `books/${id}`);
        await deleteDoc(bookDocRef);
        this.book = this.book.filter((book: Book) => book.id !== id);
      } catch (error){
        console.log("Error al borrar de Firebase: ", error);
      }
    }
  }

  async editBook(libro: Book){
    try{
      this.emptyBook = {
        ...libro,
        authors: libro.authors.join(', '),
        categories: libro.categories.join(', '),
        tags: libro.tags ? libro.tags.join(', ') : '',
      };

      this.showForm = true;
      console.log("Editando libro: ", libro.title);
    } catch(error){
      console.error("Error al cargar el libro a editar: ", error);
    }
  }

  cancelForm() {
    this.showForm = false;
    this.emptyBook = this.initBook();
  }

  get filteredBooks(){
    const term = this.searchTerms.toLowerCase().trim();

    if(!term){
      return this.book;
    }
    return this.book.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(term);
      const authorMatch = book.authors.some(author => author.toLowerCase().includes(term));
      return titleMatch || authorMatch;
    });
  }

  async importIsbn(){
    const isbn = prompt(this.translate.instant('BOOK-M.IMPORT_ISBN'));
    if(!isbn){
      return;
    }

    const cleanIsbn = isbn.replace(/[- ]/g, "");
    const apiKey = environment.googleBookKey;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;
    this.http.get(url).subscribe((res:any) => {
      if(res.totalItems === 0){
        alert(this.translate.instant('BOOK-M.ISBN_NOT_FOUND'));
        return;
      }
      const info = res.items[0].volumeInfo;

      let cover = info.imageLinks?.thumbnail || '';

      if(cover){
        cover = cover.replace('http:', 'https:');
        cover = cover.replace('&edge=curl', '');
        if (cover.includes('zoom=1')) {
          cover = cover.replace('zoom=1', 'zoom=2');
        }
      }

      this.emptyBook = {
        ...this.initBook(),
        title: info.title || '',
        authors: info.authors ? info.authors.join(', ') : '',
        isbn: cleanIsbn,
        language: info.language === 'es' ? 'Español' : (info.language === 'en' ? 'Inglés' : info.language),
        categories: info.categories,
        tags: '',
        year: info.publishedDate ? new Date(info.publishedDate).getFullYear() : new Date().getFullYear(),
        coverUrl: cover
      };

      this.showForm = true;
      console.log("Datos importados de Google Books: ", info);
    }, error => {
      console.error("Error al cargar el libro: ", error);
      alert(this.translate.instant('BOOK-M.ERROR_LOADING'));
    });
  }

  toggleCategory(cat: string){
    const index = this.emptyBook.categories.indexOf(cat);
    if (index > -1) {
      this.emptyBook.categories.splice(index, 1);
    } else {
      this.emptyBook.categories.push(cat);
    }
  }
}
