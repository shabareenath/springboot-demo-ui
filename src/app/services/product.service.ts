import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

// Use a relative path so the Angular dev server proxy can forward requests
// to the backend without triggering CORS in the browser during development.
const API_BASE = '/products';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(API_BASE);
  }

  create(productOrForm: Product | FormData): Observable<Product> {
    if (productOrForm instanceof FormData) {
      return this.http.post<Product>(API_BASE, productOrForm);
    }
    return this.http.post<Product>(API_BASE, productOrForm);
  }

  // The backend expects a PUT to /products with the full Product in the body
  // (JPA will use the id inside the entity to determine update vs insert).
  update(productOrForm: Product | FormData): Observable<any> {
    console.log(`ProductService.update: PUT ${API_BASE}`, productOrForm);
    if (productOrForm instanceof FormData) {
      return this.http.put<any>(API_BASE, productOrForm);
    }
    return this.http.put<any>(API_BASE, productOrForm);
  }

  delete(id: number): Observable<void> {
    console.log(`ProductService.delete: DELETE ${API_BASE}/${id}`);
    return this.http.delete<void>(`${API_BASE}/${id}`);
  }
}
