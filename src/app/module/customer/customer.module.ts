import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { CustomerRouterModule } from "./customer-routing.module";

@NgModule({
    imports: [
        CommonModule,
        CustomerRouterModule
    ]
})

export class CustomerModule { }