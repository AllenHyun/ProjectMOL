import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class Translation {
  private http = inject(HttpClient);

  async translateText(text: string, targetLang: string, sourceLang: string = 'es'): Promise<string> {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response: any = await firstValueFrom(this.http.get(url));

      if (response && response[0] && response[0][0] && response[0][0][0]) {
        return response[0][0][0];
      }

      return text;
    } catch (error) {
      console.error(`Error de traducción con Google (${targetLang}):`, error);
      return text;
    }
  }
}
