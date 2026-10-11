import '../../../test-setup';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TrackService } from './track.service';

describe('TrackService', () => {
  let service: TrackService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TrackService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('list() transmet page et limit', () => {
    service.list(2, 10).subscribe();

    const req = httpTesting.expectOne('/api/tracks?page=2&limit=10');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');

    req.flush({ items: [], total: 0, page: 2, pages: 1, limit: 10 });
  });

  it('delete() appelle DELETE /api/tracks/:id', () => {
    service.delete('track-123').subscribe();

    const req = httpTesting.expectOne('/api/tracks/track-123');
    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
