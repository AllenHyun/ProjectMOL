import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class Translation {
  private http = inject(HttpClient);
  private apiKey = environment.googleBookKey;
  private url = 'https://translation.googleapis.com/language/translate/v2';

  async translateText(text: string, targetLang: string): Promise<string> {
    const params = {
      q: text,
      target: targetLang,
      key: this.apiKey
    };

    try {
      const res: any = await firstValueFrom(this.http.get(this.url, { params }));
      return res.data.translations[0].translatedText;
    } catch (error) {
      console.error(`Error traduciendo a ${targetLang}:`, error);
      return text;
    }
  }
}
