import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  total_sales_count = 0;
  total_purchase_count = 0;
  tasks_count = 0;
  contacts_count = 0;

  salesData: any[] = [];
  purchaseData: any[] = [];
  tasksData: any[] = [];

  years: number[] = [];
  selectedYear = new Date().getFullYear();

  ngOnInit() {
    fetch('http://localhost:8080/dashboard', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        this.salesData = data.sales;
        this.purchaseData = data.purchase;
        this.tasksData = data.tasks;

        this.total_sales_count = this.salesData.length;
        this.total_purchase_count = this.purchaseData.length;
        this.tasks_count = data.tasks.length;
        this.contacts_count = data.contacts.length;

        this.years = this.getPreviousTenYears();
        this.renderCombinedChart();
        this.renderTasksDonut();
      });
  }

  getPreviousTenYears(): number[] {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - i);
  }

  onYearChange(e: any) {
    this.selectedYear = +e.target.value;
    this.renderCombinedChart();
  }

  renderCombinedChart() {
    const canvas = document.getElementById('combinedChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesValues = new Array(12).fill(0);
    const purchaseValues = new Array(12).fill(0);

    // Data mapping logic
    this.salesData.forEach(d => {
      const date = new Date(d.OrderDate);
      if (date.getFullYear() === this.selectedYear) salesValues[date.getMonth()]++;
    });

    this.purchaseData.forEach(d => {
      const date = new Date(d.OrderDate);
      if (date.getFullYear() === this.selectedYear) purchaseValues[date.getMonth()]++;
    });

    Chart.getChart('combinedChart')?.destroy();

    // Helper to create gradient safely
    const createGradient = (context: any, color: string) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return null; // Wait for initialization

      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, color);          // Solid color at peak
      gradient.addColorStop(1, 'transparent');  // Fade to nothing at X-axis
      return gradient;
    };

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Sales Orders',
            data: salesValues,
            borderColor: 'rgba(79, 70, 229)',
            backgroundColor: (context) => createGradient(context, 'rgba(79, 70, 229)'),
            borderWidth: 1,
            tension: 0.4,
            fill: true,
            pointRadius: 1
          },
          {
            label: 'Purchase Orders',
            data: purchaseValues,
            borderColor: '#4F0015',
            backgroundColor: (context) => createGradient(context, '#4F0015'),
            borderWidth: 1,
            tension: 0.4,
            fill: true,
            pointRadius: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }



  renderTasksDonut() {
    const statusCount: any = {
      Planned: 0,
      Completed: 0,
      Cancelled: 0
    };

    this.tasksData.forEach(task => {
      if (statusCount[task.Status] !== undefined) {
        statusCount[task.Status]++;
      }
    });

    Chart.getChart('tasksChart')?.destroy();

    new Chart('tasksChart', {
      type: 'doughnut',
      data: {
        labels: ['Planned', 'Completed', 'Cancelled'],
        datasets: [{
          data: [
            statusCount.Planned,
            statusCount.Completed,
            statusCount.Cancelled
          ],
          backgroundColor: ['#f97316', '#3b82f6', '#22c55e'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        radius: '60%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}
