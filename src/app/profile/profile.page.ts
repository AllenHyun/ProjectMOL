import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {doc, Firestore, getDoc, getDocs, updateDoc} from "@angular/fire/firestore";
import {Auth, authState} from "@angular/fire/auth";
import {User} from "../models/user";
import {ActivatedRoute} from "@angular/router";
import {filter, take} from "rxjs";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonIcon]
})
export class ProfilePage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);

  public isReadOnly = true;

  public isEditing = false;

  public user: User = {
    uid: '',
    role: 'reader',
    interests: [],
    username: 'Cargando...',
    email: '',
    level: 'Uni',
    photoUrl: '',
    createdAt: '',
    bio: ''
  };

  constructor() { }

  async ngOnInit() {
    const profileIdFromUrl = this.route.snapshot.paramMap.get('id');

    authState(this.auth).pipe(
      filter(res => res !== undefined),
      take(1)
    ).subscribe(async (currentUser) => {

      if (!profileIdFromUrl && !currentUser) {
        console.log("No hay usuario ni ID, redirigiendo...");
        return;
      }

      const uidToFetch = profileIdFromUrl || currentUser?.uid;

      if (uidToFetch) {
        const userDoc = await getDoc(doc(this.firestore, 'users', uidToFetch));
        if (userDoc.exists()) {
          this.user = userDoc.data() as User;

          this.isReadOnly = uidToFetch !== currentUser?.uid;

          console.log("¿Es solo lectura?:", this.isReadOnly);
        }
      }
    });
  }

  toggleEdit(){
    if (this.isEditing) {
      this.updateProfile();
    }
    this.isEditing = !this.isEditing;
  }

  async updateProfile() {
    try {
      const userRef = doc(this.firestore, 'users', this.user.uid);
      await updateDoc(userRef, {
        username: this.user.username,
        level: this.user.level,
        bio: this.user.bio,
        interests: this.user.interests,
        photoUrl: this.user.photoUrl,
      });
      console.log("Perfil actualizado con éxito");
    } catch (error) {
      console.log("Error al actualizar: ", error);
    }
  }

  addInterest(input: HTMLInputElement) {
    const val = input.value.trim();
    if (val && !this.user.interests.includes(val)) {
      this.user.interests.push(val);
      input.value = '';
    }
  }

  removeInterest(interest: string) {
    this.user.interests = this.user.interests.filter(i => i !== interest);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.user.photoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
}
