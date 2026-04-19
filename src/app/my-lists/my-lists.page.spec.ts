import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyListsPage } from './my-lists.page';

describe('MyListsPage', () => {
  let component: MyListsPage;
  let fixture: ComponentFixture<MyListsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyListsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
