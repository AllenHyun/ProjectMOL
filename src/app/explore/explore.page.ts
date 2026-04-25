import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {
  collection,
  collectionData,
  Firestore,
  getDocs,
  limit,
  query,
  where
} from "@angular/fire/firestore";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {star, starOutline, chevronDown, chevronUp} from "ionicons/icons";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, RouterLink, IonIcon, TranslatePipe]
})
export class ExplorePage implements OnInit {
  private firestore = inject(Firestore);
  private activatedRoute = inject(ActivatedRoute);

  public books: any[] = [];
  public filteredBooks: any[] = [];
  public searchTerm: string = "";
  public showFiltersMobile: boolean = false;
  public sortBy: string = 'recent';

  public filters = {
    language: ['Español', 'Inglés', 'Francés'],
    level: ['ESO/Bachiller', 'Universidad', 'Posgrado'],
    category: ['Acción', 'Romance', 'Thriller', 'Educativo', 'Aventura', 'Ciencia Ficción'],
    year: [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
  };

  public selectedFilters : any = {
    language: [],
    level: [],
    category: [],
    year: []
  }

  constructor() {
    addIcons({ star, starOutline, chevronDown, chevronUp });
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.searchTerm = params['q'] || "";
      this.loadBooks();
    });
  }

  async loadBooks() {
    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, { idField: 'id' }).subscribe(async (allBooks: any[]) => {
      const term = this.searchTerm.toLowerCase().trim();
      const matches = allBooks.filter(b => {
        if (!term) return true;
        const titleMatch = b.title?.toLowerCase().includes(term);
        const authorMatch = b.authors?.some((author:string) => author.toLowerCase().includes(term));
        return titleMatch || authorMatch;
      });

      this.books = await Promise.all(matches.map(async (book) => {
        const latestSummary = await this.getLatestSummary(book.id);
        return { ...book, latestSummary };
      }));

      this.applyFilters();
    });
  }

  async getLatestSummary(bookId: string){
    const summariesRef = collection(this.firestore, 'summaries');
    const q = query(
      summariesRef,
      where('bookId', '==', bookId),
      where('status', '==', 'published'),
      limit(1)
    );

    const snap = await getDocs(q);
    return !snap.empty ? snap.docs[0].data() : null;
  }

  toggleFilters(group: string, value: any) {
    const index = this.selectedFilters[group].indexOf(value);
    if (index > -1) {
      this.selectedFilters[group].splice(index, 1);
    } else {
      this.selectedFilters[group].push(value);
    }
    this.applyFilters();
  }

  applyFilters() {
    let results = this.books.filter(book => {
      const langMatch = this.selectedFilters.language.length === 0 ||
        this.selectedFilters.language.includes(book.language);

      const yearMatch = this.selectedFilters.year.length === 0 ||
        (book.year && this.selectedFilters.year.includes(Number(book.year)));

      const catMatch = this.selectedFilters.category.length === 0 ||
        (book.categories && book.categories.some((c:string) => this.selectedFilters.category.includes(c)));

      const levelMatch = this.selectedFilters.level.length === 0 ||
        this.selectedFilters.level.includes(book.level);

      return langMatch && yearMatch && catMatch && levelMatch;
    });

    if(this.sortBy === 'recent'){
      results.sort((a,b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    } else if(this.sortBy === 'rating'){
      results.sort((a,b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    }

    this.filteredBooks = results;
  }
}
