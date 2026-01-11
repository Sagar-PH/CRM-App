import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css'
})
export class CreateComponent {
  products_list: any

  ngOnInit() {
    fetch('http://localhost:8080/products/view', {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json())
      .then(data => {
        this.products_list = data['products_request']
        console.log('product request success', this.products_list)
      }).catch(err => console.log('products request failed!'))
  }

  SalesOrderSubmit(SOrderForm: any) {
    fetch('http://localhost:8080/sales_order/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SOrderForm.value)
    }).then(res => res.json())
      .then(data => {
        console.log('Sales order Submit Success')
        SOrderForm.reset()
      })
      .catch(err => console.log('Order Submit Failed'))
  }

  productIdChange(product: any, salesOrderForm: NgForm) {
    if (product !== null) {
      salesOrderForm.form.patchValue({
        quantity: 1,
        productName: product.Name
      });
    }
  }

  productQuantityChange(quantity: any, salesOrderForm: NgForm) {
    if (quantity !== null) {
      let product_value = salesOrderForm.form.value.selectedProduct

      salesOrderForm.form.patchValue({
        productId: product_value.row_id,
        totalAmount: quantity * product_value.Price
      });
    }
  }
}
