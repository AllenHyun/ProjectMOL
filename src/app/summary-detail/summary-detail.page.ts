import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonIcon} from '@ionic/angular/standalone';
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {doc, Firestore, getDoc} from "@angular/fire/firestore";
import {Summary} from "../models/summary";
import { star, starOutline, playOutline, pauseOutline, bookmarkOutline, shareOutline, flagOutline, thumbsUpOutline, thumbsDownOutline, arrowBackOutline } from 'ionicons/icons';
import {addIcons} from "ionicons";
import {TranslatePipe} from "@ngx-translate/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-summary-detail',
  templateUrl: './summary-detail.page.html',
  styleUrls: ['./summary-detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonIcon, RouterLink, TranslatePipe]
})
export class SummaryDetailPage implements OnInit {

  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  public book: any = null;
  public summary: Summary | null = null;

  public currentAudio: HTMLAudioElement | null = null;

  private readonly langMap: {[key: string]: string} = {
    'Spanish': 'es-ES',
    'Español': 'es-ES',
    'English': 'en-US',
    'Inglés': 'en-US',
    'French': 'fr-FR',
    'Francés': 'fr-FR',
  };

  constructor() {
    addIcons({
      star,
      starOutline,
      playOutline,
      pauseOutline,
      bookmarkOutline,
      shareOutline,
      flagOutline,
      thumbsUpOutline,
      thumbsDownOutline,
      arrowBackOutline
    });
  }

  async ngOnInit() {
    const summaryId = this.route.snapshot.paramMap.get('id')?.trim();

    if (summaryId) {
      try {
        const summaryRef = doc(this.firestore, 'summaries', summaryId);
        const summarySnap = await getDoc(summaryRef);

        if (summarySnap.exists()) {
          this.summary = {id: summarySnap.id, ...summarySnap.data()} as Summary;
          await this.loadBookInfo(this.summary.bookId);
        }
      } catch (error) {}
    }
  }

  private async loadBookInfo(bookId: string) {
    try {
      const bookRef = doc(this.firestore, 'books', bookId);
      const bookSnap = await getDoc(bookRef);

      if (bookSnap.exists()) {
        this.book = {...bookSnap.data(), id: bookSnap.id};
      }
    } catch (error) {}
  }

  async speakSummary(text: string, langName: string = 'Spanish') {
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
      error: () => {
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
