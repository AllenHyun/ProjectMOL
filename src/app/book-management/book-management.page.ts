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
import {Category} from "../models/category";
import {Tag} from "../models/tag";

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
  public bookDraft : any = this.initBook();
  public searchTerms: string = '';

  public availableCategories: Category[] = [];
  public availableTags: Tag[] = [];

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
    collectionData(collection(this.firestore, 'categories'), {idField: 'id'}).subscribe((data) => {
      this.availableCategories = data as Category[];
    });
    collectionData(collection(this.firestore, 'tags'), {idField: 'id'}).subscribe((data) => {
      this.availableTags = data as Tag[];
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

  async saveBookData() {
    if (!this.bookDraft.title) return;

    try {
      const processedAuthors = typeof this.bookDraft.authors === 'string'
        ? this.bookDraft.authors.split(',').map((e: any) => e.trim()).filter((e: any) => e !== "")
        : (Array.isArray(this.bookDraft.authors) ? this.bookDraft.authors : []);

      const processedCategories = Array.isArray(this.bookDraft.categories)
        ? [...this.bookDraft.categories]
        : [];

      const processedTags = typeof this.bookDraft.tags === 'string'
        ? this.bookDraft.tags.split(',').map((e: any) => e.trim()).filter((e: any) => e !== "")
        : (Array.isArray(this.bookDraft.tags) ? this.bookDraft.tags : []);

      const finalBook: any = {
        title: this.bookDraft.title,
        isbn: this.bookDraft.isbn || '',
        language: this.bookDraft.language,
        year: Number(this.bookDraft.year),
        coverUrl: this.bookDraft.coverUrl || 'assets/img/default-book.png',
        authors: processedAuthors,
        categories: processedCategories,
        tags: processedTags,
        level: this.bookDraft.level,
        ratingAvg: this.bookDraft.ratingAvg || 0,
        ratingCount: this.bookDraft.ratingCount || 0,
        sumaryCount: this.bookDraft.sumaryCount || 0
      };

      if (this.bookDraft.id) {
        const bookDocRef = doc(this.firestore, `books/${this.bookDraft.id}`);
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
    } catch (error) {
      console.error('[Project M.O.L] Error al guardar los datos del libro en Firestore:', error);
    }
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
      } catch (error) {
        console.error('[Project M.O.L] Fallo al intentar borrar el registro completo:', error);
      }
    }
  }

  async editBook(libro: Book) {
    try {
      this.bookDraft = {
        ...libro,
        authors: Array.isArray(libro.authors) ? libro.authors.join(', ') : libro.authors,
        tags: Array.isArray(libro.tags) ? libro.tags.join(', ') : (libro.tags || ''),
        categories: Array.isArray(libro.categories) ? [...libro.categories] : []
      };
      this.showForm = true;
    } catch (error) {
      console.error('[Project M.O.L] No se pudo cargar el libro en el formulario', error);
    }
  }

  cancelForm() {
    this.showForm = false;
    this.bookDraft = this.initBook();
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

        // console.log('Libro importado desde Google Books:', info.title);

        this.bookDraft = {
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
        console.error('[Project M.O.L] Fallo al recuperar datos de Google Books:', err);
      }
    });
  }

  toggleCategory(cat: Category) {
    const nameES = cat.names['es'];
    const index = this.bookDraft.categories.indexOf(nameES);
    if (index > -1) {
      this.bookDraft.categories.splice(index, 1);
    } else {
      this.bookDraft.categories.push(nameES);
    }
  }


  get filteredTags(): Tag[] {
    if (!this.availableCategories || !this.bookDraft?.categories) {
      return [];
    }
    const selectedCatIds = this.availableCategories
      .filter((cat: Category) => this.bookDraft.categories.includes(cat.names['es']))
      .map((cat: Category) => cat.id);

    return this.availableTags.filter((tag: Tag) => selectedCatIds.includes(tag.categoryId));
  }

  toggleTag(tagName: string) {
    if (!Array.isArray(this.bookDraft.tags)) {
      this.bookDraft.tags = [];
    }
    const index = this.bookDraft.tags.indexOf(tagName);
    if (index > -1) {
      this.bookDraft.tags.splice(index, 1);
    } else {
      this.bookDraft.tags.push(tagName);
    }
  }

  getCategoryDisplayName(cat: Category): string {
    if (!cat || !cat.names){
      return '';
    }

    const  currentLang = this.translate.currentLang || 'es';
    return cat.names[currentLang] || cat.names['es'] || Object.values(cat.names)[0] || '';
  }

  translateBookCategory(bookCategoryStr: string): string {
    if (!bookCategoryStr) return '';

    const matchedCategory = this.availableCategories.find(cat => {
      const names = cat.names || {};
      return Object.values(names).some(val =>
        String(val).toLowerCase() === bookCategoryStr.toLowerCase() ||
        bookCategoryStr.toLowerCase().endsWith('.' + String(val).toLowerCase())
      );
    });
    if (matchedCategory) {
      const currentLang = this.translate.currentLang || 'es';
      const catData = matchedCategory as any;
      return catData.names?.[currentLang] || catData.names?.['es'] || '';
    }

    if (bookCategoryStr.includes('.')) {
      const parts = bookCategoryStr.split('.');
      return parts[parts.length - 1];
    }

    return bookCategoryStr;
  }

}
