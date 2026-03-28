import {Component, OnInit, Input, inject} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {
  menu, chevronDownOutline, personOutline,
  notificationsOutline, bookOutline, languageOutline, helpCircleOutline,
  settingsOutline, logOutOutline, person, lockClosedOutline, chatboxEllipsesOutline
} from "ionicons/icons";
import {addIcons} from "ionicons";
import {Router, RouterLink} from "@angular/router";
import {Auth, onAuthStateChanged, authState} from "@angular/fire/auth";
import {User} from "../../models/user";
import {doc, docData, Firestore} from "@angular/fire/firestore";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink,
  ]
})
export class HeaderComponent  implements OnInit {
  @Input() isAuthPage: boolean = false;
  private router = inject(Router);
  public user: User | null = null;
  private auth = inject(Auth);
  public menuOpen: boolean = false;
  private firestore = inject(Firestore);

  constructor() {
    addIcons({menu,
      chevronDownOutline,
      person,
      personOutline,
      notificationsOutline,
    bookOutline,
      languageOutline,
      helpCircleOutline,
      settingsOutline,
      logOutOutline,
      lockClosedOutline,
      chatboxEllipsesOutline
    });
  }

  ngOnInit() {
    authState(this.auth).subscribe((authUser) => {
      if (authUser) {
        const userDocRef = doc(this.firestore, `users/${authUser.uid}`);
        docData(userDocRef).subscribe((data) => {
          this.user = data as User;
        });
      } else {
        this.user = null;
        this.menuOpen = false;
      }
    });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  async navigateRegister(){
    this.router.navigate(['/register']);
  }

  async onLogout(){
    try {
      this.menuOpen = false;
      await this.auth.signOut();
      this.user = null;
      this.router.navigate(['/login']);
    } catch (error) {
      console.log("Ha ocurrido un problema al intentar hacer logout, vuelva a intentarlo");
    }

  }

  async backHome(){
    this.router.navigate(['/home']);
  }

  async panelAdmin(){
    this.router.navigate(['/book-management']);
  }
}
