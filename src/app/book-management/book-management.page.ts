import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonIcon} from '@ionic/angular/standalone';
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
  Firestore,
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
  private http = inject(HttpClient);
  private translate = inject(TranslateService);

  public book: Book[] = [];
  public showForm = false;
  public emptyBook : any = this.initBook();
  public searchTerms: string = '';

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

    try {
      const processedAuthors = typeof this.emptyBook.authors === 'string'
        ? this.emptyBook.authors.split(',').map((e: any) => e.trim()).filter((e: any) => e !== "")
        : (Array.isArray(this.emptyBook.authors) ? this.emptyBook.authors : []);

      const processedCategories = Array.isArray(this.emptyBook.categories)
        ? [...this.emptyBook.categories]
        : [];

      const processedTags = typeof this.emptyBook.tags === 'string'
        ? this.emptyBook.tags.split(',').map((e: any) => e.trim()).filter((e: any) => e !== "")
        : (Array.isArray(this.emptyBook.tags) ? this.emptyBook.tags : []);

      const finalBook: any = {
        title: this.emptyBook.title,
        isbn: this.emptyBook.isbn || '',
        language: this.emptyBook.language,
        year: Number(this.emptyBook.year),
        coverUrl: this.emptyBook.coverUrl || 'assets/img/default-book.png',
        authors: processedAuthors,
        categories: processedCategories,
        tags: processedTags,
        level: this.emptyBook.level,
        ratingAvg: this.emptyBook.ratingAvg || 0,
        ratingCount: this.emptyBook.ratingCount || 0,
        sumaryCount: this.emptyBook.sumaryCount || 0
      };

      if (this.emptyBook.id) {
        const bookDocRef = doc(this.firestore, `books/${this.emptyBook.id}`);
        await updateDoc(bookDocRef, {
          ...finalBook,
          updateAt: new Date()
        });
      } else {
        const booksCollection = collection(this.firestore, 'books');
        await addDoc(booksCollection, {
          ...finalBook,
          createdAt: new Date()
        });
      }
      this.cancelForm();
    } catch (error) {}
  }

  async deleteBook(id: string) {
    if (confirm(this.translate.instant('BOOK-M.DELETE_CONFIRM'))) {
      try {
        const summariesRef = collection(this.firestore, 'summaries');
        const qSummaries = query(summariesRef, where('bookId', '==', id));
        const sumSnapshot = await getDocs(qSummaries);
        const deleteSummaries = sumSnapshot.docs.map( d => deleteDoc(doc(this.firestore, 'summaries', d.id)));
        await Promise.all(deleteSummaries);

        const reviewsRef = collection(this.firestore, 'reviews');
        const qReviews = query(reviewsRef, where('bookId', '==', id));
        const revSnapshot = await getDocs(qReviews);
        const deleteReview = revSnapshot.docs.map( d => deleteDoc(doc(this.firestore, 'reviews', d.id)));
        await Promise.all(deleteReview);

        const bookDocRef = doc(this.firestore, `books/${id}`);
        await deleteDoc(bookDocRef);
      } catch (error) {}
    }
  }

  async editBook(libro: Book) {
    try {
      this.emptyBook = {
        ...libro,
        authors: Array.isArray(libro.authors) ? libro.authors.join(', ') : libro.authors,
        tags: Array.isArray(libro.tags) ? libro.tags.join(', ') : (libro.tags || ''),
        categories: Array.isArray(libro.categories) ? [...libro.categories] : []
      };
      this.showForm = true;
    } catch (error) {}
  }

  cancelForm() {
    this.showForm = false;
    this.emptyBook = this.initBook();
  }

  get filteredBooks() {
    const term = this.searchTerms.toLowerCase().trim();
    if (!term) return this.book;
    return this.book.filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.authors.some(author => author.toLowerCase().includes(term))
    );
  }

  async importIsbn() {
    const isbn = prompt(this.translate.instant('BOOK-M.IMPORT_ISBN'));
    if (!isbn) return;

    const cleanIsbn = isbn.replace(/[- ]/g, "");
    const apiKey = environment.googleBookKey;
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;

    this.http.get(url).subscribe({
      next: (res: any) => {
        if (res.totalItems === 0) {
          alert(this.translate.instant('BOOK-M.ISBN_NOT_FOUND'));
          return;
        }

        const info = res.items[0].volumeInfo;
        let cover = info.imageLinks?.thumbnail || '';

        if (cover) {
          cover = cover.replace('http:', 'https:').replace('&edge=curl', '');
        }

        const langMap: { [key: string]: string } = {
          'es': 'Español',
          'en': 'Inglés',
          'fr': 'Francés'
        };

        this.emptyBook = {
          ...this.initBook(),
          title: info.title || '',
          authors: info.authors ? info.authors.join(', ') : '',
          isbn: cleanIsbn,
          language: langMap[info.language] || 'Inglés',
          categories: [],
          tags: '',
          year: info.publishedDate ? new Date(info.publishedDate).getFullYear() : new Date().getFullYear(),
          coverUrl: cover
        };

        this.showForm = true;
      },
      error: (err) => {
        if (err.status === 503) {
          alert(this.translate.instant('BOOK-M.ERROR_503'));
        } else {
          alert(this.translate.instant('BOOK-M.ERROR_LOADING'));
        }
        this.showForm = false;
      }
    });
  }

  toggleCategory(cat: string) {
    const index = this.emptyBook.categories.indexOf(cat);
    if (index > -1) {
      this.emptyBook.categories.splice(index, 1);
    } else {
      this.emptyBook.categories.push(cat);
    }
  }
}
