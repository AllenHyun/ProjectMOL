import {Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {
  addDoc, arrayRemove, arrayUnion,
  collection,
  collectionData,
  doc,
  docData,
  Firestore,
  getDoc,
  query,
  updateDoc,
  where
} from "@angular/fire/firestore";
import {Auth, authState} from "@angular/fire/auth";
import {User} from "../models/user";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {combineLatest, filter, map, Observable, of, switchMap} from "rxjs";
import {shareOutline, downloadOutline, cameraOutline, closeOutline, addOutline, banOutline, checkmarkCircleOutline, lockClosedOutline} from "ionicons/icons";
import {addIcons} from "ionicons";
import {register} from "swiper/element/bundle";
import {TranslatePipe} from "@ngx-translate/core";

register();

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, HeaderComponent, FooterComponent, IonIcon, RouterLink, IonModal, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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

  public publicList$!: Observable<any[]>;
  public JSON = JSON;

  public showShareModal = false;
  public shareCode = '';
  public listToShare: any = null;

  public swiperConfig = {
    slidesPerView: 3.5,
    spaceBetween: 16,
    navigation: true,
    breakpoints: {
      640: { slidesPerView: 3.2 },
      1024: { slidesPerView: 4.5 }
    }
  };

  public haveIBlocked: boolean = false;
  public amIBlocked: boolean = false;

  constructor() {
    addIcons({
      shareOutline, downloadOutline, cameraOutline, closeOutline, addOutline, banOutline, checkmarkCircleOutline, lockClosedOutline
    });
  }

  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      authState(this.auth).pipe(filter(res => res !== undefined))
    ]).subscribe(async ([params, currentUser]) => {
      const profileIdFromUrl = params.get('id');
      const uidToFetch = profileIdFromUrl || currentUser?.uid;

      if (uidToFetch) {
        await this.fetchProfileData(uidToFetch, currentUser);
      }
    });
  }

  async fetchProfileData(uidToFetch: string, currentUser: any) {
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', uidToFetch));
      const myDoc = await getDoc(doc(this.firestore, 'users', currentUser.uid));

      if (userDoc.exists() && myDoc.exists()) {
        const data = userDoc.data() as any;
        const myData = myDoc.data() as any;

        const myBlockedList = myData['blockedUsers'] || [];
        const theirBlockedList = data['blockedUsers'] || [];

        this.haveIBlocked = myBlockedList.includes(uidToFetch);
        this.amIBlocked = theirBlockedList.includes(currentUser.uid);

        this.user = { ...this.user, ...data, uid: uidToFetch };

        if (!this.haveIBlocked && !this.amIBlocked) {
          const listsRef = collection(this.firestore, 'lists');
          const q = query(listsRef, where('userId', '==', uidToFetch), where('isPublic', '==', true));

          this.publicList$ = collectionData(q, { idField: 'id' }).pipe(
            switchMap((lists: any[]) => {
              if (lists.length === 0) return of([]);

              const listsObservables = lists.map(list => {
                if (!list.bookIds || list.bookIds.length === 0) {
                  return of({ ...list, books: [] });
                }

                const bookRefs = list.bookIds.map((id: string) => docData(doc(this.firestore, 'books', id), { idField: 'id' }));

                return combineLatest(bookRefs).pipe(map(books => ({ ...list, books })));
              });

              return combineLatest(listsObservables);
            })
          );
        } else {
          this.publicList$ = of([]);
        }

        this.isReadOnly = uidToFetch !== currentUser?.uid;
        this.isEditing = false;
      }
    } catch (error) {
      console.error("Error al cargar perfil y listas:", error);
    }
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

      const dataToSave = {
        username: this.user.username ?? '',
        level: this.user.level ?? 'Uni',
        bio: this.user.bio || '',
        interests: this.user.interests || [],
        photoUrl: this.user.photoUrl || '',
        email: this.user.email
      };

      await updateDoc(userRef, dataToSave);

      this.isEditing = false;
    } catch (error) {
      console.error(error);
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

  openShare(list: any) {
    this.listToShare = list;
    this.shareCode = list.id;
    this.showShareModal = true;
  }

  async saveToMyLists(list: any) {
    const user = this.auth.currentUser;
    if (!user) {
      alert("Debes iniciar sesión para guardar listas");
      return;
    }
    try {
      const listsRef = collection(this.firestore, 'lists');
      await addDoc(listsRef, {
        name: `${list.name} (de ${this.user.username})`,
        userId: user.uid,
        bookIds: list.bookIds || [],
        isPublic: false,
        createdAt: new Date().toISOString(),
      });
      alert("Lista guardada en tu biblioteca");
    } catch (error) {
      console.error("Error al guardar lista: ", error);
    }
  }

  async blockUser(){
    const currentUser = this.auth.currentUser;

    if(!currentUser) {
      return;
    }
    try {
      await updateDoc(doc(this.firestore, 'users', currentUser.uid), {
        blockedUsers: arrayUnion(this.user.uid)
      });
      this.haveIBlocked = true;
    }
    catch (error) {
      console.error(error);
    }
  }

  async unblockUser(){
    const currentUser = this.auth.currentUser;
    if(!currentUser) {
      return;
    }
    try {
      await updateDoc(doc(this.firestore, 'users', currentUser.uid), {
        blockedUsers: arrayRemove(this.user.uid)
      });
      this.haveIBlocked = false;
      await this.fetchProfileData(this.user.uid, currentUser);
    } catch (error) {
      console.error(error);
    }
  }
}
