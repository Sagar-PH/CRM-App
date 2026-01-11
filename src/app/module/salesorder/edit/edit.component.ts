import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit',
  imports: [FormsModule, CommonModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css'
})
export class EditComponent {
  constructor(private route: ActivatedRoute) { }

  requested_data: any
  id!: any
  products_list: any
  selectedProduct: any

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    fetch('http://localhost:8080/products/view', {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json())
      .then(data => {
        this.products_list = data['products_request']

        fetch(`http://localhost:8080/sales_order/edit/${this.id}`, {
          method: 'GET',
          credentials: 'include'
        }).then(res => res.json())
          .then(data => {
            console.log('fetch success', data)
            this.requested_data = data['order_found']
            this.selectedProduct = this.products_list.find(
              (p: any) => p.row_id === this.requested_data.ProductId);
          })
          .catch(err => console.log('failed'))
      })
  }

  SalesOrderEditSubmit(SOrderEditForm: any) {
    fetch('http://localhost:8080/sales_order/update', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SOrderEditForm.value)
    }).then(res => res.json())
      .then(data => {
        console.log('update success', data)
      })
      .catch(err => console.log('update failed'))
  }

  productIdChange(product: any, SOEditForm: NgForm) {
    SOEditForm.form.patchValue({
      quantity: 1,
      productName: product.Name
    });
  }

  productQuantityChange(quantity: any, SOEditForm: NgForm) {
    let product_value = SOEditForm.form.value.selectedProduct

    SOEditForm.form.patchValue({
      productId: product_value.row_id,
      totalAmount: quantity * product_value.Price
    });
  }
}
