import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonHeader, IonIcon, IonInput,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import {FooterComponent} from "../components/footer/footer.component";
import {HeaderComponent} from "../components/header/header.component";
import { User} from "../models/user";
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider, sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup, signOut, reload
} from "@angular/fire/auth";
import {addIcons} from "ionicons";
import {logoGoogle} from "ionicons/icons";
import {Firestore, doc, setDoc} from "@angular/fire/firestore";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, FooterComponent, HeaderComponent, IonCard, IonCardContent, IonCardTitle, IonIcon, IonInput, IonSelect, IonSelectOption]
})
export class RegisterPage implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);
  email: string = '';
  password: string = '';
  selectLevel: 'ESO' | 'Uni' | 'Posgrado' = 'ESO';

  constructor() {
    addIcons({
      logoGoogle
    });
  }

  ngOnInit() {
  }


  async onRegister() {
    try{
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      const user = userCredential.user;

      const userProfile : User = {
        uid: user.uid,
        email: this.email,
        username: this.email.split('@')[0],
        role:'reader',
        interests: [],
        level: this.selectLevel,
        photoUrl: '',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(this.firestore, 'users', user.uid), userProfile);

      await sendEmailVerification(userCredential.user);
      this.checkVerificationStatus(userCredential.user);

      alert("Cuenta creada. Por favor, revise su correo para verificarla antes de iniciar sesión. Puede que se encuentre en Spam");
    }
    catch(error: any){
      alert("Error al registrarse: " + error.message);
    }
  }

  async registerWithGoogle(){
    try{
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      const userProfile : User = {
        uid: user.uid,
        email: user.email || '',
        username: user.email ? user.email.split('@')[0] : 'User',
        role:'reader',
        interests: [],
        level: this.selectLevel,
        photoUrl: user.photoURL || '',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(this.firestore, 'users', user.uid), userProfile, {merge: true});

      console.log("Bienvenid@ de nuevo! ", result.user.displayName);
      this.router.navigate(['/home']);
    }
    catch(error:any){
      alert(error.message);
    }
  }

  checkVerificationStatus(user: any) {
    const interval = setInterval(async () => {
      await reload(user);

      if (user.emailVerified) {
        console.log("Usuario verificado");
        clearInterval(interval);
        this.router.navigate(['/login']);
      }
    }, 3000);
  }

  async countCreated(){
    this.router.navigate(['/login']);
  }
}
