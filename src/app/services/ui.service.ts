import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UiService {
  private alertCtrl = inject(AlertController);
  private translate = inject(TranslateService);
  private router = inject(Router);

  async showLoginAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('BOOK-D.SAVE_REVIEW.HEADER'),
      message: this.translate.instant('BOOK-D.SAVE_REVIEW.MESSAGE'),
      buttons: [
        { text: this.translate.instant('BOOK-D.SAVE_REVIEW.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('BOOK-D.SAVE_REVIEW.LOGIN'),
          handler: () => this.router.navigate(['/login'])
        }
      ]
    });
    await alert.present();
  }
}
