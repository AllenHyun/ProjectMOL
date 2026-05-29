import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import {Chart, registerables} from "chart.js";
import {collection, collectionData, Firestore, getDocs, limit, orderBy, query} from "@angular/fire/firestore";
import {FooterComponent} from "../components/footer/footer.component";
import {AdminPanelComponent} from "../components/admin-panel/admin-panel.component";
import {HeaderComponent} from "../components/header/header.component";
import {Subscription} from "rxjs";
import {RouterLink} from "@angular/router";
import {TranslatePipe, TranslateService} from "@ngx-translate/core";
import {Book} from "../models/book";
import {User} from "../models/user";
import {Summary} from "../models/summary";
import {Report} from "../models/report";

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, FooterComponent, AdminPanelComponent, HeaderComponent, RouterLink, TranslatePipe]
})
export class AnalyticsPage implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private translate = inject(TranslateService);

  @ViewChild('growthChart') growthChartCanvas!: ElementRef;
  @ViewChild('distChart') distChartCanvas!: ElementRef;
  @ViewChild('qualityChart') qualityChartCanvas!: ElementRef;

  private qualityChart: Chart | null = null;
  private growthChart: Chart | null = null;
  private distChart: Chart | null = null;

  private userSub: Subscription | null = null;
  private summarySub: Subscription | null = null;
  private bookSub: Subscription | null = null;
  private reportSub: Subscription | null = null;

  private totalSummaries = 0;
  private reportedSummariesCount = 0;

  public stats = {
    dau: 0,
    mau: 0,
    reportRate: 0,
    topBooks: [] as Book[]
  }

  constructor() {

  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.summarySub?.unsubscribe();
    this.bookSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.reportSub?.unsubscribe();
  }

  ngOnInit() {
    this.listenUsersRealTime();
    this.listenSummariesRealTime();
    this.listenTopBooksRealTime();
    this.listenReportRealTime();
  }

  async listenUsersRealTime() {
    const usersRef = collection(this.firestore, 'users');
    this.userSub = collectionData(usersRef).subscribe((data: any[]) => {
      const users = data as User[];
      this.calculateActiveUsers(users);
      this.calculateGrowthChart(users);
      this.calculateUserDistribution(users);
    });
  }

  listenTopBooksRealTime() {
    const bookRef = collection(this.firestore, 'books');
    const q = query(bookRef, orderBy('ratingAvg', 'desc'), limit(3));

    this.bookSub = collectionData(q, {idField: 'id'}).subscribe((data: any[]) => {
      this.stats.topBooks = data as Book[];
    });
  }

  listenSummariesRealTime() {
    const summariesRef = collection(this.firestore, 'summaries');
    this.summarySub = collectionData(summariesRef).subscribe((data: any[]) => {
      const summaries = data as Summary[];
      this.totalSummaries = summaries.length;
      this.calculatePlatformQuality(summaries);
      this.calculateReportRate();
    });
  }

  calculateActiveUsers(users: any[]) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    this.stats.dau = users.filter(u => u.lastLogin && new Date(u.lastLogin) > oneDayAgo).length;
    this.stats.mau = users.filter(u => u.lastLogin && new Date(u.lastLogin) > oneMonthAgo).length;
  }

  calculateGrowthChart(users: any[]) {
    const growthData: { [key: string]: number } = {};

    users.forEach(u => {
      if (u.createdAt) {
        const date = new Date(u.createdAt);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        growthData[monthYear] = (growthData[monthYear] || 0) + 1;
      }
    });

    const labels = Object.keys(growthData).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      return yA !== yB ? yA - yB : mA - mB;
    });

    let cumulative = 0;
    const values = labels.map(l => {
      cumulative += growthData[l];
      return cumulative;
    });

    if (this.growthChart){
      this.growthChart.destroy();
    }

    this.growthChart = new Chart(this.growthChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: this.translate.instant('ANALYTICS.USERS'),
          data: values,
          borderColor: '#C5A059',
          backgroundColor: '#C5A05933',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  calculateUserDistribution(users: any[]) {
    const roles = { admin: 0, reader: 0, visitor: 0 };
    users.forEach(u => {
      const r = (u.role || 'reader').toLowerCase();
      if (roles.hasOwnProperty(r)) roles[r as keyof typeof roles]++;
    });

    if (this.distChart){
      this.distChart.destroy();
    }

    this.distChart = new Chart(this.distChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: [this.translate.instant('ANALYTICS.ADMIN'), this.translate.instant('ANALYTICS.READER'), this.translate.instant('ANALYTICS.GUEST')],
        datasets: [{
          data: [roles.admin, roles.reader, roles.visitor],
          backgroundColor: ['#2E473B', '#C5A059', '#A0AEC0']
        }]
      }
    });
  }

  calculatePlatformQuality(summaries: any[]) {
    const statusCount = { published: 0, rejected: 0, pending: 0 };
    summaries.forEach(s => {
      const st = s['status'] as keyof typeof statusCount;
      if (statusCount.hasOwnProperty(st)) statusCount[st]++;
    });

    if(this.qualityChart){
      this.qualityChart.destroy();
    }

    this.qualityChart = new Chart(this.qualityChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: [this.translate.instant('ANALYTICS.APPROVED'), this.translate.instant('ANALYTICS.REJECTED'), this.translate.instant('ANALYTICS.PENDING')],
        datasets: [{
          label: this.translate.instant('ANALYTICS.SUMMARIES'),
          data: [statusCount.published, statusCount.rejected, statusCount.pending],
          backgroundColor: ['#2E473B', '#E53E3E', '#C5A059']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
  listenReportRealTime(){
    const reportRef = collection(this.firestore, 'reports');
    this.reportSub = collectionData(reportRef).subscribe((data: any[]) => {
      const reports = data as Report[];
      const summaryReports = reports.filter(r => r['type'] === 'summary');
      const uniqueReportedPaths = new Set(summaryReports.map(r => r.refPath));

      this.reportedSummariesCount = uniqueReportedPaths.size;
      this.calculateReportRate();
    });
  }

  calculateReportRate(){
    if (this.totalSummaries > 0){
      this.stats.reportRate = Math.round((this.reportedSummariesCount / this.totalSummaries) * 100);
    } else {
      this.stats.reportRate = 0;
    }
  }
}
