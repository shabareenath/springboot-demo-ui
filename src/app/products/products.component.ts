import { Component, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  selectedProduct: Product | null = null;
  errorMessage = '';
  successMessage = '';

  productForm!: FormGroup;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
  ) {
    effect(() => {
      console.log('ProductsComponent initialized');
    });
  }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
    });

    this.loadProducts();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      this.imagePreviewUrl = null;
      return;
    }
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = () => (this.imagePreviewUrl = reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  loadProducts(): void {
    this.clearMessages();
    this.productService.list().subscribe({
      next: (items: Product[]) => {
        // Ensure `imageUrl` is populated so the template can show thumbnails.
        // If the API returns `imageUrl: null` but provides `imageName`, use
        // a sensible fallback path (`/uploads/<imageName>`). If your API
        // serves images from a different base, update the fallback accordingly
        // or set `product.imageUrl` server-side.
        this.products = items.map((p) => ({
          ...p,
          imageUrl:
            p.imageUrl || (p.imageName ? `/uploads/${p.imageName}` : null),
        }));
      },
      error: () =>
        (this.errorMessage =
          'Unable to load products. Check your backend API.'),
    });
  }

  saveProduct(): void {
    this.clearMessages();

    if (this.productForm.invalid) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    // Read values from the reactive form. We don't pass arguments from the
    // template — `(ngSubmit)="saveProduct()"` is fine because the form is the
    // source of truth here.
    const product = this.productForm.value as Product;

    console.log(
      'saveProduct called. selectedProduct id=',
      this.selectedProduct?.id,
      'form=',
      product,
    );

    // By convention this app now sends PUT to `/products` with the full
    // Product object in the body (including `id`) and the backend (JPA)
    // will perform the update.
    console.log(
      'saveProduct called. selectedProduct id=',
      this.selectedProduct?.id,
      'form=',
      product,
    );

    // Build payload: include id when updating (from selectedProduct or by
    // trying to match loaded products). This ensures the backend receives the
    // id in the request body as required by the server's PUT handler.
    const fallbackId = this.products.find(
      (p) =>
        p.name === this.selectedProduct?.name &&
        p.price === this.selectedProduct?.price,
    )?.id;
    const payload: Product = this.selectedProduct?.id
      ? { ...product, id: this.selectedProduct.id }
      : fallbackId
        ? { ...product, id: fallbackId }
        : product;

    if (payload.id) {
      // Update via PUT /products with id in body
      // If a file is selected, send multipart FormData; otherwise send JSON
      if (this.selectedFile) {
        const form = new FormData();
        form.append('id', String(payload.id));
        form.append('name', payload.name);
        form.append('price', String(payload.price));
        if (this.selectedFile) {
          form.append('image', this.selectedFile);
        }
        this.productService.update(form).subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully.';
            this.resetForm();
            this.loadProducts();
          },
          error: () => (this.errorMessage = 'Failed to update the product.'),
        });
      } else {
        this.productService.update(payload).subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully.';
            this.resetForm();
            this.loadProducts();
          },
          error: () => (this.errorMessage = 'Failed to update the product.'),
        });
      }
    } else {
      // No id found — create new product
      if (this.selectedFile) {
        const form = new FormData();
        form.append('name', payload.name);
        form.append('price', String(payload.price));
        form.append('image', this.selectedFile);
        this.productService.create(form).subscribe({
          next: () => {
            this.successMessage = 'Product added successfully.';
            this.resetForm();
            this.loadProducts();
          },
          error: () => (this.errorMessage = 'Failed to add the product.'),
        });
      } else {
        this.productService.create(payload).subscribe({
          next: () => {
            this.successMessage = 'Product added successfully.';
            this.resetForm();
            this.loadProducts();
          },
          error: () => (this.errorMessage = 'Failed to add the product.'),
        });
      }
    }
  }

  editProduct(product: Product): void {
    this.clearMessages();
    this.selectedProduct = product;
    this.productForm.setValue({
      name: product.name,
      price: product.price,
    });
    this.selectedFile = null;
    this.imagePreviewUrl = product.imageUrl ?? null;
  }

  deleteProduct(product: Product): void {
    this.clearMessages();
    if (!product.id) {
      this.errorMessage = 'Cannot delete this product.';
      return;
    }

    this.productService.delete(product.id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully.';
        if (this.selectedProduct?.id === product.id) {
          this.resetForm();
        }
        this.loadProducts();
      },
      error: () => (this.errorMessage = 'Failed to delete the product.'),
    });
  }

  resetForm(): void {
    this.selectedProduct = null;
    this.productForm.reset({
      name: '',
      price: 0,
    });
    this.clearMessages();
    this.selectedFile = null;
    this.imagePreviewUrl = null;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
