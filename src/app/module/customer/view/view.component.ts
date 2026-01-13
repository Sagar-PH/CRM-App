import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-view',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './view.component.html',
  styleUrl: './view.component.css'
})
export class ViewComponent {
  customers:any

  ngOnInit() {
    fetch('http://localhost:8080/customers/view', {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json())
    .then(data => {
      console.log(data)
      this.customers = data['customers_request']
    }).catch(err => console.log(err))
  }
}
