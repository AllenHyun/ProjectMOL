import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonContent, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {HeaderComponent} from "../components/header/header.component";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {Book} from "../models/book";

@Component({
  selector: 'app-book-management',
  templateUrl: './book-management.page.html',
  styleUrls: ['./book-management.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent, FooterComponent, AdminPanelComponent, IonIcon, IonModal]
})
export class BookManagementPage implements OnInit {
  public book: Book[] = [];
  public isModalOpen = false;
  public emptyBook = {
    title: '',
    authors:'',
    isbn:'',
    categories:'',
    coverUrl:''
  };


  constructor() { }

  ngOnInit() {
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  addBook() {
    const newBook: Book = {
      id: Date.now().toString(),
      title: this.emptyBook.title,
      authors: this.emptyBook.authors.split(',').map(e => e.trim()),
      isbn: this.emptyBook.isbn,
      language:'Español',
      categories: this.emptyBook.categories.split(',').map(e => e.trim()),
      tags: [],
      coverUrl: this.emptyBook.coverUrl || 'https://via.placeholder.com/200',
      createdAt: new Date().toISOString()
    };
    this.book.push(newBook);
    this.setOpen(false);
    this.resetForm();
  }

  deleteBook(id: string) {
    this.book.filter((book) => book.id !== id)
  }

  resetForm() {
    this.emptyBook = { title: '', authors: '', isbn: '', categories: '', coverUrl: '' };  }

}
