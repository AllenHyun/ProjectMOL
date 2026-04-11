import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import {collection, collectionData, doc, Firestore, getDoc, getDocs, query, where} from "@angular/fire/firestore";
import {addIcons} from "ionicons";
import {
  chevronDownOutline, closeOutline,
  personOutline,
  playOutline,
  searchOutline,
  thumbsDownOutline,
  thumbsUpOutline
} from "ionicons/icons";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-summary',
  templateUrl: './summary.page.html',
  styleUrls: ['./summary.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonIcon, RouterLink, TranslatePipe]
})
export class SummaryPage implements OnInit {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  public searchTerms: string = '';
  public allBooks: any[] = [];
  public suggestions: any[] = [];
  public showSuggestion: boolean = false;
  public summaries: any[] = [];
  public filteredSummaries: any[] = [];

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

  public currentAudio: HTMLAudioElement | null = null;
  private readonly langMap: {[key: string]: string} = {
    'Español': 'es-ES',
    'Inglés': 'en-US',
    'Francés': 'fr-FR',
  };

  constructor() {
    addIcons({
      searchOutline,
      thumbsUpOutline,
      thumbsDownOutline,
      playOutline,
      personOutline,
      chevronDownOutline,
      closeOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, {idField: 'id'}).subscribe(books => {
      this.allBooks = books;
      this.loadSummaries();
    });
  }


  async loadSummaries() {
    const resRef = collection(this.firestore, 'summaries');
    const q = query(resRef, where('status', '==', 'published'));

    const querySnapshot = await getDocs(q);
    const rawSummaries = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    this.summaries = await Promise.all(rawSummaries.map(async (sum: any) => {
      const book = this.allBooks.find(b => b.id === sum['bookId']);

      let photo = '';
      if (sum['userId']) {
        const userSnap = await getDoc(doc(this.firestore, 'users', sum['userId']));
        if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          photo = userData.photoUrl || '';
        }
      }

      return {
        ...sum,
        bookTitle: book?.title || '...',
        bookAuthor: book?.authors?.join(', ') || '...',
        coverUrl: book?.coverUrl || 'assets/img/default-book.png',
        bookLanguage: book?.language,
        bookYear: book?.year,
        bookCategory: book?.categories || [],
        bookLevel: book?.level,
        authorPhotoUrl: photo
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

    this.filteredSummaries = this.summaries.filter(sum => {
      const matchesSearch = !term ||
        sum.bookTitle.toLowerCase().includes(term) ||
        sum.bookAuthor.toLowerCase().includes(term);

      const langMatch = this.selectedFilters.language.length === 0 || this.selectedFilters.language.includes(sum.bookLanguage);
      const yearMatch = this.selectedFilters.year.length === 0 || this.selectedFilters.year.includes(Number(sum.bookYear));
      const catMatch = this.selectedFilters.category.length === 0 || sum.bookCategory.some((c: string) => this.selectedFilters.category.includes(c));
      const levelMatch = this.selectedFilters.level.length === 0 || this.selectedFilters.level.includes(sum.bookLevel);

      return matchesSearch && langMatch && yearMatch && catMatch && levelMatch;
    });
  }

  toggleDropdown(filterName: string) {
    this.openFilter = this.openFilter === filterName ? null : filterName;
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


}
