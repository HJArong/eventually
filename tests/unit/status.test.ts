import { describe, expect, it } from "vitest";
import {
  assertTransition,
  bestSlotStatus,
  canTransition,
  InvalidTransitionError,
  isOpen,
  isQuoteExpired,
  isTerminal,
  slotStatusFor,
} from "@/lib/domain/status";

describe("booking status machine", () => {
  it("allows the happy path with the right actors", () => {
    expect(canTransition("draft", "requested", "planner")).toBe(true);
    expect(canTransition("requested", "quoted", "vendor")).toBe(true);
    expect(canTransition("requested", "quoted", "system")).toBe(true);
    expect(canTransition("quoted", "accepted", "planner")).toBe(true);
    expect(canTransition("accepted", "deposit_paid", "system")).toBe(true);
    expect(canTransition("deposit_paid", "confirmed", "system")).toBe(true);
  });

  it("rejects wrong actors and skipped steps", () => {
    expect(canTransition("quoted", "accepted", "vendor")).toBe(false);
    expect(canTransition("requested", "accepted", "planner")).toBe(false);
    expect(canTransition("requested", "confirmed", "system")).toBe(false);
    expect(canTransition("requested", "declined", "planner")).toBe(false);
    expect(() => assertTransition("confirmed", "cancelled", "planner")).toThrow(InvalidTransitionError);
  });

  it("supports side exits and re-quoting expired requests", () => {
    expect(canTransition("requested", "declined", "vendor")).toBe(true);
    expect(canTransition("quoted", "expired", "system")).toBe(true);
    expect(canTransition("expired", "quoted", "vendor")).toBe(true);
    expect(canTransition("accepted", "cancelled", "planner")).toBe(true);
  });

  it("knows terminal and open states", () => {
    expect(isTerminal("confirmed")).toBe(true);
    expect(isTerminal("declined")).toBe(true);
    expect(isTerminal("quoted")).toBe(false);
    expect(isOpen("quoted")).toBe(true);
    expect(isOpen("expired")).toBe(false);
  });

  it("expires quotes after their valid-until date", () => {
    expect(isQuoteExpired("2026-11-08", "2026-11-09")).toBe(true);
    expect(isQuoteExpired("2026-11-09", "2026-11-09")).toBe(false);
  });
});

describe("event slots", () => {
  it("maps request status to slot status", () => {
    expect(slotStatusFor("requested")).toBe("requested");
    expect(slotStatusFor("quoted")).toBe("quote_in");
    expect(slotStatusFor("confirmed")).toBe("booked");
    expect(slotStatusFor("declined")).toBe("find");
  });
  it("shows the most advanced request in a slot", () => {
    expect(bestSlotStatus([])).toBe("find");
    expect(bestSlotStatus(["declined", "requested", "quoted"])).toBe("quote_in");
    expect(bestSlotStatus(["quoted", "confirmed"])).toBe("booked");
  });
});
