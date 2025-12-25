import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { DashboardAuthGuard } from './shared/dashboard.auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [DashboardAuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'salesorder',
        loadChildren: () =>
            import('./module/salesorder/salesorder.module')
                .then(m => m.SalesOrderModule)
    },
    {
        path: 'purchaseorder',
        loadChildren: () =>
            import('./module/purchaseorder/purchaseorder.module')
                .then(m => m.PurchaseOrderModule)
    }
];
