import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

/// ★ Innovation Feature — Student Progress Dashboard

@Injectable({ providedIn: 'root' })
export class ProgressService {
  constructor(private api: ApiService) {}

  getGradeTrend(userId: number) {
    return this.api.get(`/progress/${userId}/grades`);
  }

  getCourseCompletion(userId: number) {
    return this.api.get(`/progress/${userId}/courses`);
  }

  getSubmissionRate(userId: number) {
    return this.api.get(`/progress/${userId}/submissions`);
  }

  getUpcomingDeadlines(userId: number) {
    return this.api.get(`/progress/${userId}/deadlines`);
  }
}
