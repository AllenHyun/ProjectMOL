import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySummariesPage } from './my-summaries.page';

describe('MySummariesPage', () => {
  let component: MySummariesPage;
  let fixture: ComponentFixture<MySummariesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MySummariesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
