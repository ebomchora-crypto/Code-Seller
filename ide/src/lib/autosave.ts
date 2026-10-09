import { api, ProjectDetail } from './api';
type SaveInput = { revision: number; files: Record<string, string> };
export class Autosave {
  project: ProjectDetail;
  files: Record<string, string>;
  status: 'saved' | 'saving' | 'error' = 'saved';
  error: string | null = null;
  private pending: Promise<void> | null = null;
  onChange: () => void = () => {};
  constructor(project: ProjectDetail, private transport = (input: SaveInput) => api<ProjectDetail>(`/projects/${project.id}`, 'PUT', input)) {
    this.project = project; this.files = project.files;
  }
  update(files: Record<string, string>) {
    this.files = files;
    void this.flush().catch(() => {});
  }
  flush(): Promise<void> {
    if (this.pending) return this.pending;
    if (this.files === this.project.files) return Promise.resolve();
    this.status = 'saving'; this.error = null; this.onChange();
    this.pending = this.drain().finally(() => { this.pending = null; this.onChange(); });
    return this.pending;
  }
  private async drain() {
    try {
      while (this.files !== this.project.files) {
        const files = this.files;
        const saved = await this.transport({ revision: this.project.revision, files });
        // Use the submitted object to detect edits that arrived while saving.
        this.project = { ...saved, files };
      }
      this.status = 'saved';
    } catch (error) {
      this.status = 'error'; this.error = (error as Error).message; throw error;
    }
  }
  replace(project: ProjectDetail) {
    this.project = project; this.files = project.files; this.status = 'saved'; this.error = null; this.onChange();
  }
}
