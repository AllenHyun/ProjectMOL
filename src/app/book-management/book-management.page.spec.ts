import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookManagementPage } from './book-management.page';

describe('BookManagementPage', () => {
  let component: BookManagementPage;
  let fixture: ComponentFixture<BookManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
