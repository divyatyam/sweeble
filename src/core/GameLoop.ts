export class GameLoop {
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1 / 60; // 60 Hz fixed timestep

  constructor(
    private updateFn: (dt: number) => void,
    private renderFn: (interpolation: number) => void
  ) {}

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.isRunning = false;
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateFn(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    const interpolation = this.accumulator / this.fixedDeltaTime;
    this.renderFn(interpolation);

    requestAnimationFrame(this.loop.bind(this));
  }
}
