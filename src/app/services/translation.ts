import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class Translation {
  private http = inject(HttpClient);
  private url = 'https://lingva.ml/api/v1';

  async translateText(text: string, targetLang: string): Promise<string> {
    const url = `${this.url}/es/${targetLang}/${encodeURIComponent(text)}`;

    try {
      const res: any = await firstValueFrom(this.http.get(url));
      return res.translation;
    } catch (error) {
      console.error(`Error con Lingva (${targetLang}):`, error);
      return text;
    }
  }
}
