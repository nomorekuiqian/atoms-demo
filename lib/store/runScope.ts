/** Identity guard for asynchronous work against a shared workspace store. */
export class RunScope {
  private active: { projectId: string; requestId: string; controller: AbortController } | null = null;

  start(projectId: string, requestId: string) {
    this.cancel();
    const token = { projectId, requestId, controller: new AbortController() };
    this.active = token;
    return {
      signal: token.controller.signal,
      current: (currentProject: string) => this.active === token && currentProject === projectId,
      finish: () => { if (this.active === token) this.active = null; },
    };
  }

  stop() { this.active?.controller.abort(); }
  cancel() {
    const previous = this.active;
    this.active = null;
    previous?.controller.abort();
  }
}
