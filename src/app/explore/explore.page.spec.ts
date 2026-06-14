import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExplorePage } from './explore.page';
import { Firestore } from '@angular/fire/firestore';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import {Auth} from "@angular/fire/auth";
import { of } from 'rxjs';

fdescribe('ExplorePage (Tests TFG)', () => {
  let component: ExplorePage;
  let fixture: ComponentFixture<ExplorePage>;

  const firestoreMock = {
    collection: jasmine.createSpy('collection').and.returnValue({}),
  };

  const translateMock = {
    currentLang: 'es'
  };

  const authMock = {
    currentUser: null,
    authState: of(null)
  };

  const activatedRouteMock = {
    queryParams: of({ q: '' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorePage],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Auth, useValue: authMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorePage);
    component = fixture.componentInstance;

    spyOn(component, 'loadBooks').and.stub();
  });

  it('Debería crearse el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('Debería añadir y quitar filtros al usar toggleFilters', () => {
    component.toggleFilters('category', 'Acción');
    expect(component.selectedFilters.category).toContain('Acción');

    component.toggleFilters('category', 'Acción');
    expect(component.selectedFilters.category).not.toContain('Acción');
  });

  it('Debería filtrar los libros correctamente por idioma', () => {
    component.books = [
      { id: '1', title: 'Libro en Español', language: 'Español' } as any,
      { id: '2', title: 'Libro en Inglés', language: 'Inglés' } as any
    ];

    component.selectedFilters.language = ['Inglés'];

    component.applyFilters();

    expect(component.filteredBooks.length).toBe(1);
    expect(component.filteredBooks[0].title).toBe('Libro en Inglés');
  });

  it('Debería ordenar los libros correctamente por valoración (rating)', () => {
    component.books = [
      { id: '1', title: 'Libro Malo', ratingAvg: 2 } as any,
      { id: '2', title: 'Libro Excelente', ratingAvg: 5 } as any,
      { id: '3', title: 'Libro Regular', ratingAvg: 3 } as any
    ];

    component.sortBy = 'rating';

    component.selectedFilters = { language: [], level: [], category: [], year: [] };

    component.applyFilters();

    expect(component.filteredBooks[0].title).toBe('Libro Excelente');
    expect(component.filteredBooks[1].title).toBe('Libro Regular');
    expect(component.filteredBooks[2].title).toBe('Libro Malo');
  });

});
