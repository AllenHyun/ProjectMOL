import {Component, OnInit, Input, inject} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {menu, chevronDownOutline} from "ionicons/icons";
import {addIcons} from "ionicons";
import {Router} from "@angular/router";
import {Auth, onAuthStateChanged} from "@angular/fire/auth";
import {User} from "../../models/user";
import {doc, docData, Firestore} from "@angular/fire/firestore";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    IonicModule
  ]
})
export class HeaderComponent  implements OnInit {
  @Input() isAuthPage: boolean = false;
  private router = inject(Router);
  public user: User | null = null;
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    addIcons({menu, chevronDownOutline});
  }

  ngOnInit() {
    onAuthStateChanged(this.auth, (authUser) => {
      if(authUser) {
        const userDocRef = doc(this.firestore, `users/${authUser.uid}`);
        docData(userDocRef).subscribe((data) => {
          this.user = data as User;
        });
      } else{
        this.user = null;
      }
    });
  }

  async navigateRegister(){
    this.router.navigate(['/register']);
  }

  async onLogout(){
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
