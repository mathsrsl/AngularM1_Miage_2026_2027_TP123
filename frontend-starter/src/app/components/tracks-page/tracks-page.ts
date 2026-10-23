import { Component, inject, signal, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly deletingId = signal<string | null>(null);

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal('');
  
  readonly playingTrack = signal<Track | null>(null);
  readonly audioUrl = signal('');
  readonly audioError = signal('');
  
  readonly title = new FormControl('', { nonNullable: true });
  file?: File;

  constructor() {
    this.load();
  }

  ngOnDestroy(): void {
    // evite les fuites de mémoire (Memory Leak) si composant détruit pendant qu'une piste est en mémoire
    const currentUrl = this.audioUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
  }

  choose(event: Event): void {
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.uploadProgress.set(null);
    this.file = (event.target as HTMLInputElement).files?.[0];
    
    if (!this.file) return;

    if (!this.file.type.startsWith('audio/')) {
      this.uploadError.set('Le fichier doit être un format audio valide.');
      this.file = undefined;
      return;
    }

    if (this.file.size > 25 * 1024 * 1024) {
      this.uploadError.set('Le fichier est trop volumineux (maximum 25 Mo).');
      this.file = undefined;
      return;
    }

    console.debug('[TracksPage] Fichier sélectionné', this.file.name);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(''); // reset l'erreur au chargement
    this.service.list(this.page()).subscribe({
      next: (response) => {
        console.debug('[TracksPage] Pistes chargées', response.items.length);
        this.tracks.set(response.items);
        this.pages.set(response.pages);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Chargement impossible', err);
        this.error.set('Impossible de charger les pistes. Veuillez réessayer plus tard.');
        this.loading.set(false);
      },
    });
  }

  go(page: number): void {
    this.page.set(page);
    this.load();
  }

  upload(): void {
    if (!this.file) return;

    const currentFile = this.file;
    const totalSize = currentFile.size;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set('');
    this.uploadSuccess.set('');
    this.title.disable();

    this.service.upload(currentFile, this.title.value || currentFile.name).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = (event.total && event.total > 0) ? event.total : totalSize;
          const progress = total > 0 ? Math.min(100, Math.round((100 * event.loaded) / total)) : 0;
          this.uploadProgress.set(progress);
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.ResponseHeader) {
          this.uploadProgress.set(100);
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          const track = event.body;
          console.debug('[TracksPage] Piste envoyée', track?.id);
          this.title.setValue('');
          this.title.enable();
          this.file = undefined;
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
          this.uploadSuccess.set('Piste importée avec succès.');
          this.uploading.set(false);
          this.uploadProgress.set(null);
          this.cdr.markForCheck();
          this.page.set(1);
          this.load();
        }
      },
      error: (err) => {
        console.error('[TracksPage] Envoi impossible', err);
        this.uploadError.set(err.error?.message ?? "Erreur lors de l'envoi du fichier.");
        this.uploading.set(false);
        this.uploadProgress.set(null);
        this.title.enable();
        this.cdr.markForCheck();
      }
    });
  }

  play(track: Track): void {
    this.audioError.set('');
    this.playingTrack.set(track);
    
    this.service.audio(track.id).subscribe({
      next: (blob) => {
        console.debug('[TracksPage] Audio chargé', track.id);
        const previousUrl = this.audioUrl();
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        this.audioUrl.set(URL.createObjectURL(blob));
      },
      error: (err) => {
        console.error('[TracksPage] Lecture impossible', err);
        this.audioError.set("Impossible de lire ce morceau.");
        this.playingTrack.set(null);
      },
    });
  }

  remove(track: Track): void {
    if (!confirm(`Supprimer "${track.title}" ?`)) return;

    // avoid double click
    if (this.deletingId()) return;
    this.deletingId.set(track.id);

    this.service.delete(track.id).subscribe({
      next: () => {
        this.snackBar.open('Piste supprimée.', 'OK', { duration: 3000 });
        // Si était en lecture -> arrête le lecteur
        if (this.playingTrack()?.id === track.id) {
          const url = this.audioUrl();
          if (url) URL.revokeObjectURL(url);
          this.audioUrl.set('');
          this.playingTrack.set(null);
        }
        this.deletingId.set(null);
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Suppression impossible', err);
        const message = err.status === 404
          ? 'Cette piste n\'existe plus.'
          : err.error?.message ?? 'Erreur lors de la suppression.';
        this.snackBar.open(message, 'Fermer', { duration: 5000 });
        this.deletingId.set(null);
        // 404 = piste existe plus, on recharge la liste pour nettoyer
        if (err.status === 404) this.load();
      },
    });
  }
}
