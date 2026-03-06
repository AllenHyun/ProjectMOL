import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardTitle,
  IonContent,
  IonHeader, IonInput,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonCard, IonCardTitle, IonCardContent, IonButton, IonInput]
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor() { }

  ngOnInit() {
  }

  onLogin() {
    if (this.email && this.password){
      console.log('Datos almacenados: ',{
        correo: this.email,
        clave: this.password
      });

      alert("Login realizado correctamente");
    }
    else {
      alert("Rellene todos los campos");
    }
  }

}
