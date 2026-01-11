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

        fetch(`http://localhost:8080/purchase_order/edit/${this.id}`, {
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

      }).catch(err => console.log('products request failed!'))
  }

  PurchaseOrderEditSubmit(POrderEditForm: any) {
    fetch('http://localhost:8080/purchase_order/update', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(POrderEditForm.value)
    }).then(res => res.json())
      .then(data => {
        console.log('update success', data)
      })
      .catch(err => console.log('update failed'))
  }

  productIdChange(product: any, purchaseOrderForm: NgForm) {
    purchaseOrderForm.form.patchValue({
      quantity: 1,
      productName: product.Name
    });
  }

  productQuantityChange(quantity: any, purchaseOrderForm: NgForm) {
    let product_value = purchaseOrderForm.form.value.selectedProduct

    purchaseOrderForm.form.patchValue({
      productId: product_value.row_id,
      totalAmount: quantity * product_value.Price
    });
  }
}
