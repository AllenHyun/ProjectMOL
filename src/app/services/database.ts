import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Book } from '../models/book';
@Injectable({
  providedIn: 'root',
})
export class Database {
  private firestore = inject(Firestore);

  getBooks(): Observable<Book[]> {
    const booksRef = collection(this.firestore, 'books');
    return collectionData(booksRef, {idField: 'id'}) as Observable<Book[]>;
  }

  getBooksByCategory(category: string): Observable<Book[]> {
    const booksRef = collection(this.firestore, 'books');
    const q = query(booksRef, where('categories', 'array-contains', category));
    return collectionData(q, {idField: 'id'}) as Observable<Book[]>;
  }
}
