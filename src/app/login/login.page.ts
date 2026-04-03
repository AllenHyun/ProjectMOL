import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  authState
} from "@angular/fire/auth";
import { inject } from "@angular/core";
import { addIcons } from "ionicons";
import { logoGoogle } from "ionicons/icons";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonHeader, IonInput,
  IonTitle,
  IonToolbar, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { HeaderComponent } from "../components/header/header.component";
import { FooterComponent } from "../components/footer/footer.component";
import {Router, RouterLink} from "@angular/router";
import { doc, docData, Firestore, getDoc, setDoc } from "@angular/fire/firestore";
import { User } from "../models/user";
import {AuthError} from "../services/auth-error";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonCard, IonCardTitle, IonCardContent, IonInput, IonIcon, TranslatePipe, RouterLink]
})
export class LoginPage implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private firestore = inject(Firestore);
  private errorService = inject(AuthError);
  private translate = inject(TranslateService);
  public user: User | null = null;
  email: string = '';
  password: string = '';

  constructor() {
    addIcons({
      logoGoogle
    });
  }

  ngOnInit() {
    authState(this.auth).subscribe((authUser) => {
      if (authUser) {
        const emailName = authUser.email ? authUser.email.split('@')[0] : 'User';
        this.user = { username: emailName, email: authUser.email || '' } as User;

        const userDocRef = doc(this.firestore, `users/${authUser.uid}`);
        docData(userDocRef).subscribe((data: any) => {
          if (data) {
            this.user = {
              ...data,
              username: (data.username && data.username.trim() !== "") ? data.username : emailName,
              email: (data.email && data.email.trim() !== "") ? data.email : (authUser.email || '')
            } as User;
          }
        });
      }
      else {
        this.user = null;
      }
    });
  }

  // Si el usuario inicia sesión con Google, directamente le creará la cuenta si no existe
  // SI el usuario añade directamente el correo y la contraseña, el sistema mirará si tiene cuenta o no

  async onLogin() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      const user = userCredential.user;

      if (user.emailVerified) {
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists() || !userSnap.data()?.['username'] || !userSnap.data()?.['email']) {
          const newUser: User = {
            uid: user.uid,
            email: user.email || '',
            username: user.email ? user.email.split('@')[0] : 'User',
            role: 'reader',
            level: 'ESO',
            interests: [],
            photoUrl: '',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUser, { merge: true });
        }

        console.log("Bienvenid@ de nuevo! ", user.email);
        this.router.navigate(['/first-page']);
      } else {
        await signOut(this.auth);
        alert(this.translate.instant('LOGIN.VERIFY'))
      }

    } catch (error: any) {
      const msg = this.errorService.getErrorMessage(error.code);
      alert(msg);
    }
  }

  async logingWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists() || !userSnap.data()?.['username'] || !userSnap.data()?.['email']) {
        const newUser: User = {
          uid: user.uid,
          email: user.email || '',
          username: user.email ? user.email.split('@')[0] : 'User',
          role: 'reader',
          level: 'ESO',
          interests: [],
          photoUrl: user.photoURL || '',
          createdAt: new Date().toISOString()
        }
        await setDoc(userDocRef, newUser, { merge: true });
      }
      console.log("Bienvenid@ de nuevo! ", user.email);
      this.router.navigate(['/first-page']);
    }
    catch (error: any) {
      const msg = this.errorService.getErrorMessage(error.code);
      alert(msg);
    }
  }

  async forgotPassword() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('LOGIN.FORGOT_PASSWORD_MODAL.HEADER'),
      message: this.translate.instant('LOGIN.FORGOT_PASSWORD_MODAL.MESSAGE'),
      inputs: [
        {
          name: 'resetEmail',
          type: 'email',
          placeholder: this.translate.instant('LOGIN.FORGOT_PASSWORD_MODAL.PLACEHOLDER'),
          value: this.email,
        }
      ],
      buttons: [
        {
          text: this.translate.instant('LOGIN.FORGOT_PASSWORD_MODAL.CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('LOGIN.FORGOT_PASSWORD_MODAL.CONFIRM'),
          handler: (data) => {
            this.sendResetLink(data.resetEmail);
          }
        }
      ]
    });
    await alert.present();
  }

  async sendResetLink(email: string) {
    if (!email) {
      alert(this.translate.instant('LOGIN.MESSAGES.INVALID_EMAIL'));
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      alert(this.translate.instant('LOGIN.MESSAGES.RESET_MAIL_SENT'));
    }
    catch (error: any) {
      const msg = this.errorService.getErrorMessage(error.code);
      alert(msg);
    }
  }
}
