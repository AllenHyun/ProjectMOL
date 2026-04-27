import {Component, OnInit, Input, inject} from '@angular/core';
import {ActionSheetController, IonicModule} from "@ionic/angular";
import {
  menu, chevronDownOutline, personOutline,
  notificationsOutline, bookOutline, languageOutline, helpCircleOutline,
  settingsOutline, logOutOutline, person, lockClosedOutline, chatboxEllipsesOutline, homeOutline, documentTextOutline, personAddOutline, searchOutline,
  listOutline
} from "ionicons/icons";
import {addIcons} from "ionicons";
import {Router, RouterLink} from "@angular/router";
import {Auth, onAuthStateChanged, authState} from "@angular/fire/auth";
import {User} from "../../models/user";
import {collection, collectionData, doc, docData, Firestore, query, where} from "@angular/fire/firestore";
import {CommonModule} from "@angular/common";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {of, Subscription, switchMap} from "rxjs";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink,
    TranslatePipe,
    FormsModule,
  ]
})
export class HeaderComponent  implements OnInit {
  @Input() isAuthPage: boolean = false;
  private router = inject(Router);
  public user: User | null = null;
  private auth = inject(Auth);
  public menuOpen: boolean = false;
  private firestore = inject(Firestore);

  public unreadCount: number = 0;
  private notiSub: Subscription | null = null;

  private translate = inject(TranslateService);
  private actionSheet = inject(ActionSheetController);
  public languages = [
    {code: 'es', name: 'Español'},
    {code: 'en', name: 'English'},
    {code: 'fr', name: 'Français'},
  ]

  public searchTerms: string = '';
  public allBooks: any[] = [];
  public suggestions: any[] = [];
  public showSuggestion: boolean = false;

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
      chatboxEllipsesOutline,
      homeOutline,
      documentTextOutline,
      personAddOutline,
      searchOutline,
      listOutline
    });
  }

  ngOnInit() {
    authState(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          this.listenNotifications(authUser.uid);
          const userDocRef = doc(this.firestore, `users/${authUser.uid}`);
          return docData(userDocRef);
        } else {
          this.unreadCount = 0;
          this.unsubscribeNotis();
          return of(null);
        }
      })
    ).subscribe((data) => {
      this.user = data as User;
      if (!data) {
        this.menuOpen = false;
      }
    });

    const booksRef = collection(this.firestore, 'books');
    collectionData(booksRef, {idField: 'id'}).subscribe(data => {
      this.allBooks = data;
    });
  }

  ngOnDestroy() {
    this.unsubscribeNotis();
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
      this.user = null;
      await this.auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.log("Ha ocurrido un problema al intentar hacer logout, vuelva a intentarlo");
    }

  }

  async backHome(){
    this.router.navigate(['/home']);
  }

  async panelAdmin(){
    this.router.navigate(['/admin/gestion-libros']);
  }

  async openLanguageSelector(){
    const button = this.languages.map(lang => ({
      text: lang.name,
      handler: () => {
        this.setLanguage(lang.code);
      }
    }));
    button.push({
      text: this.translate.instant('HEADER.LANGUAGE.CANCEL'),
      role: 'cancel',
      handler: () => {}
    } as any);
    const action = await this.actionSheet.create({
      header: this.translate.instant('HEADER.LANGUAGE.SELECT'),
      buttons: button
    });
    await action.present();
  }

  setLanguage(langCode: string){
    this.translate.use(langCode);
    localStorage.setItem('language', langCode);
    this.menuOpen = false;
  }

  get currentLanguage(): string{
    const currentLang = this.translate.currentLang || 'es';
    const language = this.languages.find(lang => lang.code === currentLang);
    return language ? language.name : 'Español';
  }

  onInputChange() {
    if (this.searchTerms.length > 1) {
      const term = this.searchTerms.toLowerCase();
      this.suggestions = this.allBooks.filter(book =>
        book.title.toLowerCase().includes(term) ||
        book.authors.some((a: string) => a.toLowerCase().includes(term))
      ).slice(0, 5);
      this.showSuggestion = this.suggestions.length > 0;
    } else {
      this.showSuggestion = false;
    }
  }

  selectSuggestion(book: any){
    this.searchTerms = book.title;
    this.showSuggestion = false;
    this.router.navigate(['/explore'], {queryParams: {q: book.title}});
  }

  onSearch() {
    this.showSuggestion = false;
    if(this.searchTerms.trim()){
      this.router.navigate(['/explore'], {
        queryParams: {q: this.searchTerms}
      });
    } else {
      this.router.navigate(['/explore']);
    }
  }

  protected readonly setTimeout = setTimeout;

  hideSuggestions() {
    setTimeout(() => {this.showSuggestion = false;}, 200);
  }

  private listenNotifications(uid: string) {
    this.unsubscribeNotis();

    const notiRef = collection(this.firestore, `notifications`);
    const q = query(notiRef, where('userId', '==', uid), where('read', '==', false));

    this.notiSub = collectionData(q).subscribe(notis =>{
      this.unreadCount = notis.length;
    });
  }

  private unsubscribeNotis() {
    if (this.notiSub) {
      this.notiSub.unsubscribe();
      this.notiSub = null;
    }
  }
}
