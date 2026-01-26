import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EtfChartComponent } from './etf-chart/etf-chart.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EtfChartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('etfs-app');
}
