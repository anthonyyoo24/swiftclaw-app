import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { timeAgo } from "./utils";

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const now = new Date("2026-01-01T12:00:00Z").getTime();

  it("returns 'just now' for less than 1 minute ago", () => {
    expect(timeAgo(now - 30_000)).toBe("just now");
    expect(timeAgo(now - 59_000)).toBe("just now");
  });

  it("returns minutes for 1–59 minutes ago", () => {
    expect(timeAgo(now - 60_000)).toBe("1 min ago");
    expect(timeAgo(now - 30 * 60_000)).toBe("30 min ago");
    expect(timeAgo(now - 59 * 60_000)).toBe("59 min ago");
  });

  it("returns singular 'hour' for exactly 1 hour ago", () => {
    expect(timeAgo(now - 60 * 60_000)).toBe("1 hour ago");
  });

  it("returns plural 'hours' for 2–23 hours ago", () => {
    expect(timeAgo(now - 2 * 60 * 60_000)).toBe("2 hours ago");
    expect(timeAgo(now - 23 * 60 * 60_000)).toBe("23 hours ago");
  });

  it("returns singular 'day' for exactly 1 day ago", () => {
    expect(timeAgo(now - 24 * 60 * 60_000)).toBe("1 day ago");
  });

  it("returns plural 'days' for 2+ days ago", () => {
    expect(timeAgo(now - 2 * 24 * 60 * 60_000)).toBe("2 days ago");
    expect(timeAgo(now - 3 * 24 * 60 * 60_000)).toBe("3 days ago");
  });
});
