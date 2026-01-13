import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  CustomerSubmit(CustomerForm:any) {
    fetch('http://localhost:8080/customers/create', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(CustomerForm.value)
    }).then(res => res.json())
    .then(data => {
      console.log('insert success:: ', data)
      CustomerForm.reset()
    }).catch(err => console.log(err))
  }
}
