import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail} from "@angular/fire/auth";
import {inject} from "@angular/core";
import  {addIcons} from "ionicons";
import {logoGoogle} from "ionicons/icons";
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
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {Router} from "@angular/router";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonCard, IonCardTitle, IonCardContent, IonInput, IonIcon]
})
export class LoginPage implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  email: string = '';
  password: string = '';

  constructor() {
    addIcons({
      logoGoogle
    });
  }

  ngOnInit() {
  }

  // Si el usuario inicia sesión con Google/Facebook/Apple, directamente le creará la cuenta si no existe
  // SI el usuario añade directamente el correo y la contraseña, el sistema mirará si tiene cuenta o no

  async onLogin() {
    try{
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      console.log("Bienvenid@ de nuevo! ", userCredential.user);
      this.router.navigate(['/home']);
    } catch (error:any) {
      if (error.code === "auth/user-not-found"){
        alert(error.message);
      } else if (error.code === "auth/wrong-password"){
        alert(error.message);
      }
      else{
        alert(error.message);
      }
    }
  }

  async logingWithGoogle(){
    try{
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log("Bienvenid@ de nuevo! ", result.user.displayName);
      this.router.navigate(['/home']);
    }
    catch(error:any){
      alert(error.message);
    }
  }

  async forgotPassword(){
    const alert = await this.alertCtrl.create({
      header: 'Restablecer contraseña',
      message: 'Introduce tu correo electrónico para poder restablecer la contraseña',
      inputs: [
        {
          name: 'resetEmail',
          type: 'email',
          placeholder: 'ejemplo@correo.com',
          value: this.email,
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar enlace',
          handler: (data) => {
            this.sendResetLink(data.resetEmail);
          }
        }
      ]
    });
    await alert.present();
  }

  async sendResetLink(email: string){
    if (!email){
      alert("Introduce un correo válido");
      return;
    }

    try {
      await sendPasswordResetEmail(this.auth, email);
      alert("Correo enviado. Revisa tu bandeja de correo, puede estar en Spam.");
    }
    catch(error: any){
      alert(error.message);
    }
  }
}
