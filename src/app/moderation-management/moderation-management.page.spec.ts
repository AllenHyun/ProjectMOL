import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModerationManagementPage } from './moderation-management.page';

describe('ModerationManagementPage', () => {
  let component: ModerationManagementPage;
  let fixture: ComponentFixture<ModerationManagementPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModerationManagementPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
