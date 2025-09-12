import { promises as fs } from "fs";
import path from "path";

export interface BotMetrics {
  startTime: number;
  messagesProcessed: number;
  commandsProcessed: number;
  errors: number;
  activeChats: Set<number>;
  lastMessageAt: number | null;
}

class BotMetricsService {
  private metrics: BotMetrics = {
    startTime: Date.now(),
    messagesProcessed: 0,
    commandsProcessed: 0,
    errors: 0,
    activeChats: new Set<number>(),
    lastMessageAt: null,
  };

  private persistPath = path.join(process.cwd(), "data", "bot", "metrics.json");
  private persistScheduled = false;

  constructor() {
    // best-effort load existing metrics
    this.load().catch(() => {});
  }

  private async load() {
    try {
      const buf = await fs.readFile(this.persistPath, "utf-8");
      const data = JSON.parse(buf);
      this.metrics.startTime = data.startTime || Date.now();
      this.metrics.messagesProcessed = data.messagesProcessed || 0;
      this.metrics.commandsProcessed = data.commandsProcessed || 0;
      this.metrics.errors = data.errors || 0;
      this.metrics.lastMessageAt = data.lastMessageAt || null;
      if (Array.isArray(data.activeChats)) {
        this.metrics.activeChats = new Set<number>(data.activeChats);
      }
    } catch {}
  }

  private schedulePersist() {
    if (this.persistScheduled) return;
    this.persistScheduled = true;
    setTimeout(async () => {
      try {
        await fs.mkdir(path.dirname(this.persistPath), { recursive: true });
        const toSave = {
          ...this.toJSON(),
          activeChats: Array.from(this.metrics.activeChats),
        };
        await fs.writeFile(this.persistPath, JSON.stringify(toSave, null, 2));
      } catch {}
      this.persistScheduled = false;
    }, 1000);
  }

  recordMessage(chatId?: number) {
    this.metrics.messagesProcessed += 1;
    if (typeof chatId === "number") this.metrics.activeChats.add(chatId);
    this.metrics.lastMessageAt = Date.now();
    this.schedulePersist();
  }

  recordCommand(chatId?: number) {
    this.metrics.commandsProcessed += 1;
    if (typeof chatId === "number") this.metrics.activeChats.add(chatId);
    this.metrics.lastMessageAt = Date.now();
    this.schedulePersist();
  }

  recordError() {
    this.metrics.errors += 1;
    this.schedulePersist();
  }

  toJSON() {
    const uptimeMs = Date.now() - this.metrics.startTime;
    return {
      startTime: this.metrics.startTime,
      uptimeMs,
      messagesProcessed: this.metrics.messagesProcessed,
      commandsProcessed: this.metrics.commandsProcessed,
      errors: this.metrics.errors,
      activeChats: this.metrics.activeChats.size,
      lastMessageAt: this.metrics.lastMessageAt,
    };
  }
}

export const botMetricsService = new BotMetricsService();
export default botMetricsService;
