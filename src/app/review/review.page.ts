import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {collection, collectionData, doc, Firestore, getDoc, getDocs, query, where} from "@angular/fire/firestore";
import {addIcons} from "ionicons";
import {searchOutline, thumbsUpOutline, thumbsDownOutline, personOutline, star, starOutline, chevronDownOutline, closeOutline, bookOutline} from "ionicons/icons";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonIcon, RouterLink]
})
export class ReviewPage implements OnInit {
  private firestore = inject(Firestore);

  public searchTerms: string = '';
  public allBooks: any[] = [];
  public suggestions: any[] = [];
  public showSuggestion: boolean = false;
  public reviews: any[] = [];
  public filteredReviews: any[] = [];

  public filters = {
    languages: ['Español', 'Inglés', 'Francés'],
    levels: ['ESO/Bachiller', 'Universidad', 'Posgrado'],
    categories: ['Acción', 'Romance', 'Thriller', 'Educativo', 'Aventura', 'Ciencia Ficción'],
    years: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
  };

  public selectedFilters: any = {
    language: [],
    level: [],
    category: [],
    year: []
  }

  public openFilter: string | null = null;

  constructor() {
    addIcons({
      searchOutline, thumbsUpOutline, thumbsDownOutline, personOutline, star, starOutline, chevronDownOutline, closeOutline, bookOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, {idField: 'id'}).subscribe(books => {
      this.allBooks = books;
      this.loadReviews();
    });
  }

  async loadReviews() {
    const revRef = collection(this.firestore, 'reviews');
    const q = query(revRef);

    const querySnapshot = await getDocs(q);
    const rawReviews = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    this.reviews = await Promise.all(rawReviews.map(async (rev: any) => {
      const book = this.allBooks.find(d => d.id === rev.bookId);
      let photo = '';
      let username = 'Usuario';

      if (rev.userId) {
        const userSnap = await getDoc(doc(this.firestore, 'users', rev.userId));
        if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          photo = userData.photoUrl || '';
          username = userData.username || 'Usuario';
        }
      }

      return {
        ...rev,
        bookTitle: book?.title || '...',
        bookAuthor: book?.authors?.join(', ') || '...',
        coverUrl: book?.coverUrl || 'assets/img/default-book.png',
        bookLanguage: book?.language,
        bookYear: book?.year,
        bookCategory: book?.categories || [],
        bookLevel: book?.level,
        authorPhotoUrl: photo,
        userName: username,
        stars: Array(5).fill(0).map((_, i) => i < (rev.rating || 0))
      };
    }));

    this.applyFilters();
  }

  onInputChange() {
    const term = this.searchTerms.toLowerCase().trim();
    if (term.length > 1) {
      this.suggestions = this.allBooks.filter(book =>
        book.title.toLowerCase().includes(term) ||
        book.authors?.some((a: string) => a.toLowerCase().includes(term))
      ).slice(0, 5);
      this.showSuggestion = this.suggestions.length > 0;
    } else {
      this.showSuggestion = false;
    }
    this.applyFilters();
  }

  selectSuggestion(book: any) {
    this.searchTerms = book.title;
    this.showSuggestion = false;
    this.applyFilters();
  }

  toggleFilter(group: any, value: any) {
    const index = this.selectedFilters[group].indexOf(value);
    if (index > -1) {
      this.selectedFilters[group].splice(index, 1);
    } else {
      this.selectedFilters[group].push(value);
    }
    this.applyFilters();
  }

  applyFilters() {
    const term = this.searchTerms.toLowerCase().trim();

    this.filteredReviews = this.reviews.filter(rev => {
      const matchesSearch = !term ||
        rev.bookTitle.toLowerCase().includes(term) ||
        rev.bookAuthor.toLowerCase().includes(term);

      const langMatch = this.selectedFilters.language.length === 0 || this.selectedFilters.language.includes(rev.bookLanguage);
      const yearMatch = this.selectedFilters.year.length === 0 || this.selectedFilters.year.includes(Number(rev.bookYear));
      const catMatch = this.selectedFilters.category.length === 0 || rev.bookCategory.some((c: string) => this.selectedFilters.category.includes(c));
      const levelMatch = this.selectedFilters.level.length === 0 || this.selectedFilters.level.includes(rev.bookLevel);

      return matchesSearch && langMatch && yearMatch && catMatch && levelMatch;
    });
  }

  toggleDropdown(filterName: string) {
    this.openFilter = this.openFilter === filterName ? null : filterName;
  }

}
