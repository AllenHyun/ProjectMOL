import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider} from "@angular/fire/auth";
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
  IonToolbar, IonIcon
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
}
