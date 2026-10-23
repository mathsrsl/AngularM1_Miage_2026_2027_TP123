import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly success = signal('');
  readonly error = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.auth.profile().subscribe({
      next: (user) => {
        this.form.setValue({ name: user.name });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // 401 errors are handled by the interceptor (redirect to /login).
        // Other errors are shown to the user.
        this.error.set('Impossible de charger le profil.');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.success.set('');
    this.error.set('');

    this.auth.update(this.form.getRawValue().name).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Profil mis à jour avec succès.');
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Impossible de sauvegarder les modifications.');
      },
    });
  }
}
