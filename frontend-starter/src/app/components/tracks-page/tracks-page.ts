import { Component, inject, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

@Component({
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  
  readonly uploading = signal(false);
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

    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set('');

    this.service.upload(this.file, this.title.value || this.file.name).subscribe({
      next: (track) => {
        console.debug('[TracksPage] Piste envoyée', track.id);
        this.title.setValue('');
        this.file = undefined;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.uploadSuccess.set('Piste importée avec succès.');
        this.uploading.set(false);
        this.page.set(1);
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Envoi impossible', err);
        this.uploadError.set(err.error?.message ?? "Erreur lors de l'envoi du fichier.");
        this.uploading.set(false);
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
}
