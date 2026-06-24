import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookManagementPage } from './book-management.page';
import { Firestore } from '@angular/fire/firestore';
import { TranslateService } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { EnvironmentInjector } from '@angular/core';
import { of } from 'rxjs';

fdescribe('BookManagementPage (Tests TFG)', () => {
  let component: BookManagementPage;
  let fixture: ComponentFixture<BookManagementPage>;

  const firestoreMock = {
    collection: jasmine.createSpy('collection').and.returnValue({}),
    doc: jasmine.createSpy('doc').and.returnValue({})
  };

  const translateMock = {
    instant: jasmine.createSpy('instant').and.returnValue('Texto traducido'),
    currentLang: 'es'
  };

  const authMock = {
    currentUser: null,
    authState: of(null)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookManagementPage, HttpClientTestingModule],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: ActivatedRoute, useValue: { paramMap: of({}) } },
        { provide: Auth, useValue: authMock },
        { provide: EnvironmentInjector, useValue: { runInContext: (fn: any) => fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookManagementPage);
    component = fixture.componentInstance;
  });

  it('Debería crearse el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('Debería ocultar el formulario y vaciar el libro al darle a cancelar', () => {
    component.showForm = true;
    component.bookDraft.title = 'Libro Basura';

    component.cancelForm();

    expect(component.showForm).toBeFalse();
    expect(component.bookDraft.title).toBe('');
  });

  it('Debería filtrar los libros por el título buscado', () => {
    component.book = [
      { id: '1', title: 'El Quijote', authors: ['Anónimo'], language: 'es', year: 1554 } as any,
      { id: '2', title: 'Harry Potter', authors: ['J.K. Rowling'], language: 'es', year: 1997 } as any
    ];

    component.searchTerms = 'harry';

    const results = component.filteredBooks;

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Harry Potter');
  });

  it('Debería cargar los datos de un libro existente para poder editarlo', () => {
    const libroPrueba = {
      id: '99',
      title: 'El Señor de los Anillos',
      authors: ['Cervantes'],
      tags: ['Aventura'],
      categories: ['Clásico']
    } as any;

    component.editBook(libroPrueba);

    expect(component.showForm).toBeTrue();
    expect(component.bookDraft.title).toBe('El Señor de los Anillos');
    expect(component.bookDraft.authors).toBe('Cervantes');
  });
});
