import {Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToggle, IonToolbar} from '@ionic/angular/standalone';
import {
  addDoc, arrayRemove,
  collection,
  collectionData, deleteDoc,
  doc,
  docData,
  Firestore, getDoc,
  query,
  updateDoc,
  where
} from "@angular/fire/firestore";
import {Auth} from "@angular/fire/auth";
import {combineLatest, map, Observable, of, switchMap, tap} from "rxjs";
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {RouterLink} from "@angular/router";
import {register} from "swiper/element/bundle";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {addIcons} from "ionicons";
import {addOutline, pencilOutline, trashOutline, closeCircleOutline, checkmarkOutline, shareOutline, downloadOutline, timeOutline, calendarOutline} from "ionicons/icons";
import {Reminder} from "../models/reminder";

register();

@Component({
  selector: 'app-my-lists',
  templateUrl: './my-lists.page.html',
  styleUrls: ['./my-lists.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, RouterLink, IonModal, TranslatePipe, IonIcon, IonToggle],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyListsPage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private translate = inject(TranslateService);

  public listWithBooks$!: Observable<any[]>;
  public JSON = JSON;
  public showCreateModal = false;
  public newListName = '';

  public swiperConfig = {
    slidesPerView: 5.5,
    spaceBetween: 16,
    navigation: true,
    observer: true,
    observerParents: true,
    breakpoints: {
      640: {slidesPerView: 4.2},
      1024: {slidesPerView: 6.2},
      1500: {slidesPerView: 8.5}
    }
  };

  public showEditModal = false;
  public selectedList: any = null;
  public editListName = '';
  public showShareModal = false;
  public showImportModal = false;
  public shareCode = '';
  public importCode = '';
  public listToShare: any = null;

  public showRemindersModal = false;
  public reminders: Reminder[] = [];
  public isEditingReminder = false;

  public currentReminderId: string | null = null;
  public reminderTitle = '';
  public reminderDate = '';
  public remindDaysBefore = 1;

  constructor() {
    addIcons({addOutline, trashOutline, pencilOutline, closeCircleOutline, checkmarkOutline, shareOutline, downloadOutline, calendarOutline, timeOutline});
  }

  ngOnInit() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.loadLists(user.uid);
        this.loadReminders(user.uid);
      }
    });
  }

  loadLists(userId: string) {
    const listsRef = collection(this.firestore, 'lists');
    const q = query(listsRef, where('userId', '==', userId));

    this.listWithBooks$ = collectionData(q, { idField: 'id' }).pipe(
      tap(list => {
        if(list.length === 0) {
          this.createDefaultLists(userId);
        }
      }),
      switchMap((lists: any[]) => {
        if (lists.length === 0) return of([]);

        const listsObservables = lists.map(list => {
          if (!list.bookIds || list.bookIds.length === 0) {
            return of({ ...list, books: [] });
          }

          const bookRefs = list.bookIds.map((id: string) =>
            docData(doc(this.firestore, 'books', id), { idField: 'id' })
          );

          return combineLatest(bookRefs).pipe(
            map(books => ({ ...list, books }))
          );
        });

        return combineLatest(listsObservables);
      })
    );
  }

  loadReminders(userId: string) {
    const remindersRef = collection(this.firestore, 'reminders');
    const q = query(remindersRef, where('userId', '==', userId));

    collectionData(q, { idField: 'id' }).subscribe(data => {
      const sortedReminders = (data as Reminder[]).sort((a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      );

      this.reminders = [...sortedReminders];
    });
  }

  async createList(){
    const user = this.auth.currentUser;
    if (!this.newListName.trim() || !user){
      return;
    }

    try {
      const listsRef = collection(this.firestore, 'lists');
      await addDoc(listsRef, {
        name: this.newListName.trim(),
        userId: user.uid,
        bookIds: [],
        isPublic: false,
        createdAt: new Date().toISOString()
      });
      this.newListName = '';
      this.showCreateModal = false;
    } catch (error) {}
  }

  openEditModal(list: any){
    this.selectedList = list;
    this.editListName = list.name;
    this.showEditModal = true;
  }

  async updateListName(){
    if (!this.editListName.trim() || !this.selectedList){
      return;
    }

    try {
      const listRef = doc(this.firestore, 'lists', this.selectedList.id);
      await updateDoc(listRef, {name: this.editListName.trim()});
      this.showEditModal = false;
    } catch (error) {}
  }

  async removeBookFromlist(bookId: string){
    if(!this.selectedList){
      return;
    }

    try {
      const listRef = doc(this.firestore, 'lists', this.selectedList.id);
      await updateDoc(listRef, {bookIds: arrayRemove(bookId)});
      this.selectedList.books = this.selectedList.books.filter((b: any) => b.id !== bookId);
    } catch (error){}
  }

  async deleteList(listId: string) {
    if (!confirm(this.translate.instant('MY_LISTS.CONFIRM_DELETE'))) return;

    try {
      const listRef = doc(this.firestore, 'lists', listId);
      await deleteDoc(listRef);
      this.showEditModal = false;
    } catch (error) {}
  }

  openShare(list: any){
    this.listToShare = list;
    this.shareCode = list.id;
    this.showShareModal = true;
  }

  async importListByCode(){
    const user = this.auth.currentUser;

    if(!this.importCode.trim() || !user){
      return;
    }

    try {
      const sharedListRef = doc(this.firestore, 'lists', this.importCode.trim());
      const snap = await getDoc(sharedListRef);

      if(snap.exists()){
        const data = snap.data();
        const listRef = collection(this.firestore, 'lists');
        const importedSuffix = this.translate.instant('MY_LISTS.IMPORTED_SUFFIX');

        await addDoc(listRef, {
          name: `${data['name']} ${importedSuffix}`,
          userId: user.uid,
          bookIds: data['bookIds'] || [],
          createdAt: new Date().toISOString()
        });
        this.showImportModal = false;
        this.importCode = '';
      } else{
        alert(this.translate.instant('MY_LISTS.INVALID_CODE'));
      }
    } catch (error) {}
  }

  private async createDefaultLists(userId: string) {
    const defaultNames = [
      this.translate.instant('MY_LISTS.DEFAULTS.TO_READ'),
      this.translate.instant('MY_LISTS.DEFAULTS.IN_PROGRESS'),
      this.translate.instant('MY_LISTS.DEFAULTS.READ'),
      this.translate.instant('MY_LISTS.DEFAULTS.FAVORITES')
    ];

    try {
      const listRef = collection(this.firestore, 'lists');
      const promises = defaultNames.map((name) =>
        addDoc(listRef, {
          name: name,
          userId: userId,
          bookIds: [],
          isPublic: false,
          createdAt: new Date().toISOString()
        }));
      await Promise.all(promises);
    } catch (error) {}
  }

  async togglePublicStatus(list: any){
    try {
      const listRef = doc(this.firestore, 'lists', list.id);
      await updateDoc(listRef, {isPublic: list.isPublic});
    } catch (error) {}
  }

  openRemindersModal(){
    this.resetReminderForm();
    this.showRemindersModal = true;
  }

  async saveReminder(){
    const user = this.auth.currentUser;
    if (!this.reminderTitle.trim() || !this.reminderDate || !user){
      return;
    }

    try {
      const remindersRef = collection(this.firestore, 'reminders');

      const reminderData = {
        userId: user.uid,
        title: this.reminderTitle.trim(),
        eventDate: new Date(this.reminderDate).toISOString(),
        remindDaysBefore: Number(this.remindDaysBefore),
        createdAt: new Date().toISOString()
      };

      if (this.isEditingReminder && this.currentReminderId){
        const reminderDoc = doc(this.firestore, `reminders/${this.currentReminderId}`);

        await updateDoc(reminderDoc, {
          userId: reminderData.userId,
          title: reminderData.title,
          eventDate: reminderData.eventDate,
          remindDaysBefore: reminderData.remindDaysBefore,
          createdAt: reminderData.createdAt
        });

        await this.createNotificationAlert(user.uid, reminderData);
      } else {
        await addDoc(remindersRef, reminderData);
        await this.createNotificationAlert(user.uid, reminderData);
      }
      this.resetReminderForm();
    } catch (error) {
      console.log("Error al guardar el recordatorio: ", error);
    }
  }

  editReminder(reminder: Reminder){
    this.isEditingReminder = true;
    this.currentReminderId = reminder.id || null;
    this.reminderTitle = reminder.title;

    const dateObj = new Date(reminder.eventDate);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    this.reminderDate = dateObj.toISOString().slice(0, 16);
    this.remindDaysBefore = reminder.remindDaysBefore;
  }

  async deleteReminder(id: string){
    if (!confirm(this.translate.instant('SUMMARIES.CONFIRM_DELETE'))) {
      return;
    }

    try {
      const reminderDoc = doc(this.firestore, `reminders/${id}`);
      await deleteDoc(reminderDoc);
      if (this.currentReminderId === id){
        this.resetReminderForm();
      }
    } catch (error) {}
  }

  protected resetReminderForm(){
    this.isEditingReminder = false;
    this.currentReminderId = null;
    this.reminderTitle = '';
    this.reminderDate = '';
    this.remindDaysBefore = 1;
  }

 private async createNotificationAlert(userUid: string, reminder: Omit<Reminder, 'id'>){
    try {
      const notificationRef = collection(this.firestore, 'notifications');
      const formattedDate = new Date(reminder.eventDate).toLocaleString();

      await addDoc(notificationRef, {
        userUid: userUid,
        title: `RECORDATORIO: ${reminder.title}`,
        text: `Tienes un evento programado para el día: ${formattedDate}. Alerta configurada con ${reminder.remindDaysBefore} día(s) de antelación.`,
        read: false,
        createdAt: new Date().toISOString()
      });
      console.log("Notificación generada");
    } catch (error){
      console.error("Error el crear la notificación interna: ", error);
    }
 }
}
