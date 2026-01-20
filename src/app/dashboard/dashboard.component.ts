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
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  Math = Math

  total_revenue = 0;
  revenue_growth = 0;

  total_sales = 0;
  sales_growth = 0;

  featured_product = '';
  featured_product_revenue = 0;
  featured_product_revenue_collected = '';

  total_purchase = 0;
  purchase_growth = 0;

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
    this.loadDatabaseAndCharts()
    this.loadSalesTrends()
    this.loadTopProduct()
  }

  loadDatabaseAndCharts() {
    fetch('http://localhost:8080/dashboard', {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json())
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
      })
      .catch(err => console.log('submit failed'));
  }

  loadSalesTrends() {
    fetch('http://localhost:8080/analytics/sales-trends', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)

        const current_revenue = data.reduce((sum: number, sale: any) => {
          return sum += sale.current_period.revenue
        }, 0)

        const current_sales = data.reduce((sum: number, sale: any) => {
          return sum += sale.current_period.units
        }, 0)

        const previous_revenue = data.reduce((sum: number, sale: any) => {
          return sum += sale.previous_period.revenue
        }, 0)

        const previous_sales = data.reduce((sum: number, sale: any) => {
          return sum += sale.previous_period.units
        }, 0)

        this.total_revenue = current_revenue
        this.total_sales = current_sales

        let highest_rev, lowest_rev
        let highest_sales, lowest_sales

        if (current_revenue > previous_revenue) {
          highest_rev = current_revenue
          lowest_rev = previous_revenue
        } else if (previous_revenue > current_revenue) {
          highest_rev = previous_revenue
          lowest_rev = current_revenue
        }

        if (highest_rev) {
          this.revenue_growth = Math.round((100 * (highest_rev - lowest_rev)) / highest_rev);
        }

        if (current_sales > previous_sales) {
          highest_sales = current_sales
          lowest_sales = previous_sales
        } else if (previous_sales > current_sales) {
          highest_sales = previous_sales
          lowest_sales = current_sales
        }

        if (highest_sales) {
          this.sales_growth = Math.round((100 * (highest_sales - lowest_sales)) / highest_sales);
        }
      }).catch(err => console.log('submit failed'))
  }

  formatRevenue(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1) + 'B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + 'K';
    }
    return '₹' + value.toString();
  }

  loadTopProduct() {
    fetch('http://localhost:8080/analytics/top-products', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log(data)

        let revenue_product: any
        let revenue_percentage = -1

        const product_total_revenue = data.reduce((rev_sum: any, product: any) => {
          return rev_sum += product.product_revenue
        }, 0)

        data.forEach((product: any) => {
          console.log()
          const product_revenue = Math.round(
            (100 * (product_total_revenue - product.product_revenue)) / product_total_revenue);

          console.log(product.productName, product_revenue)

          if (revenue_percentage === -1 || product_revenue > revenue_percentage) {
            revenue_percentage = product_revenue
            revenue_product = product
          }
        })

        if (revenue_percentage > 0) {
          this.featured_product = revenue_product.productName
          this.featured_product_revenue = revenue_percentage
          this.featured_product_revenue_collected = this.formatRevenue(revenue_product.product_revenue)
        }

      }).catch(err => console.log(err))
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
    const canvas = document.getElementById('lightLineChart') as HTMLCanvasElement;
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
    const createGradient = (context: any) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;

      if (!chartArea) return null; // Wait for initialization

      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');          // Solid color at peak
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');  // Fade to nothing at X-axis
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
            backgroundColor: (context) => createGradient(context),
            fill: true,
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: '#4f46e5',
            pointRadius: 3
          },
          {
            label: 'Purchase Orders',
            data: purchaseValues,
            borderColor: '#4F0015',
            backgroundColor: (context) => createGradient(context),
            borderWidth: 2,
            borderDash: [6, 6],
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { grid: { color: '#f1f5f9' }, border: { display: false } },
          x: { grid: { display: false } }
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

    new Chart('lightDonutChart', {
      type: 'doughnut',
      data: {
        labels: ['Planned', 'Completed', 'Cancelled'],
        datasets: [{
          data: [
            statusCount.Planned,
            statusCount.Completed,
            statusCount.Cancelled
          ],
          backgroundColor: ['#4f46e5', '#818cf8', '#e2e8f0'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        radius: '65%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}
