import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {Book} from "../models/book";
import {addDoc, collection, collectionData, deleteDoc, doc, Firestore, updateDoc} from "@angular/fire/firestore";
import {addIcons} from "ionicons";
import {
  searchOutline,
  checkmarkOutline,
  closeOutline,
  trashOutline,
  arrowBackOutline,
  imageOutline,
  brushOutline,
} from "ionicons/icons";

@Component({
  selector: 'app-book-management',
  templateUrl: './book-management.page.html',
  styleUrls: ['./book-management.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon]
})
export class BookManagementPage implements OnInit {
  private firestore: Firestore = inject(Firestore);
  public book: Book[] = [];
  public showForm = false;
  public emptyBook : any = this.initBook();



  constructor() {
    addIcons({
      searchOutline,
      checkmarkOutline,
      closeOutline,
      trashOutline,
      arrowBackOutline,
      imageOutline,
      brushOutline
    })
  }

  ngOnInit() {
    const booksCollection = collection(this.firestore, 'books');
    collectionData(booksCollection, {idField: 'id'}).subscribe((data) => {
      this.book = data as Book[];
    });
  }

  initBook() {
    return {
      title: '',
      authors: '',
      isbn: '',
      language: 'Español',
      categories: '',
      tags: '',
      year: new Date().getFullYear(),
      coverUrl: ''
    };
  }


  async addBook() {
    if (!this.emptyBook.title) return;

    try{

    const finalBook: Book = {
      title: this.emptyBook.title,
      isbn: this.emptyBook.isbn || '',
      language: this.emptyBook.language,
      year: Number(this.emptyBook.year),
      coverUrl: this.emptyBook.coverUrl || 'https://via.placeholder.com/150',
      authors: this.emptyBook.authors ? this.emptyBook.authors.split(',').map((e: any) => e.trim()) : [],
      categories: this.emptyBook.categories ? this.emptyBook.categories.split(',').map((e: any) => e.trim()) : [],
      tags: this.emptyBook.tags ? this.emptyBook.tags.split(',').map((e: any) => e.trim()) : [],
      id: Date.now().toString(),
      createdAt: new  Date().toISOString(),
      ratingAvg: 0,
      ratingCount: 0,
      sumaryCount: 0
    };

    if(this.emptyBook.id){
      const  bookDocRef = doc(this.firestore, `books/${this.emptyBook.id}`);
      await updateDoc(bookDocRef, {
        ...finalBook,
        updateAt: new Date().toISOString(),
      });
    } else{
      const booksCollection = collection(this.firestore, 'books');
      await addDoc(booksCollection, {
        ...finalBook,
        createAt: new Date().toISOString(),
        ratingAvg: 0,
        ratingCount: 0,
        sumaryCount: 0
      });
    }
      this.cancelForm();
    } catch(error) {
      console.log("Error al guardar en Firebase: ", error);
    }
  }

  async deleteBook(id: string) {
    try{
      const bookDocRef = doc(this.firestore, `books/${id}`);
      await deleteDoc(bookDocRef);
    } catch (error){
      console.log("Error al borrar de Firebase: ", error);
    }
  }

  async editBook(libro: Book){
    try{
      this.emptyBook = {
        ...libro,
        authors: libro.authors.join(', '),
        categories: libro.categories.join(', '),
        tags: libro.tags ? libro.tags.join(', ') : '',
      };

      this.showForm = true;
      console.log("Editando libro: ", libro.title);
    } catch(error){
      console.error("Error al cargar el libro a editar: ", error);
    }
  }

  cancelForm() {
    this.showForm = false;
    this.emptyBook = this.initBook();
  }

}
