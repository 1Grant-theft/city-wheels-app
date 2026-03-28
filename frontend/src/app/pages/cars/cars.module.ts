import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarsComponent } from './cars.component';
import { CarDetailsComponent } from '../car-details/car-details.component';

const routes: Routes = [
    { path: '', component: CarsComponent },
    { path: ':id', component: CarDetailsComponent }
];

@NgModule({
    declarations: [
        CarsComponent,
        CarDetailsComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule
    ]
})
export class CarsModule { }
