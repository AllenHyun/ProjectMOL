import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TakedownsPage } from './takedowns.page';

describe('TakedownsPage', () => {
  let component: TakedownsPage;
  let fixture: ComponentFixture<TakedownsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TakedownsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
