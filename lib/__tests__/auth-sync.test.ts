import { announceAuthChange, freshStart, isFromAnotherTab, onAuthChange } from "../auth-sync";

const tick = () => new Promise((r) => setTimeout(r, 20));
const replace = jest.fn();
// The tests run outside a browser: a stand-in for the bits of window used.
(globalThis as unknown as { window: unknown }).window = { location: { replace }, addEventListener: () => {}, removeEventListener: () => {} };

describe("a tab never reloads itself on its own sign-in", () => {
  it("ignores its own message, acts on another tab's", async () => {
    let heard = 0;
    const stop = onAuthChange(() => { heard++; });
    announceAuthChange();
    await tick();
    expect(heard).toBe(0);
    const other = new BroadcastChannel("rc-auth");
    other.postMessage({ area: "staff", at: Date.now(), from: "another-tab" });
    await tick();
    expect(heard).toBe(1);
    other.close();
    stop();
  });

  it("once leaving for the next page, nothing reloads it", async () => {
    let heard = 0;
    const stop = onAuthChange(() => { heard++; });
    freshStart("/admin");
    expect(replace).toHaveBeenCalledWith("/admin");
    const other = new BroadcastChannel("rc-auth");
    other.postMessage({ area: "staff", at: Date.now(), from: "another-tab" });
    await tick();
    expect(heard).toBe(0);
    expect(isFromAnotherTab({ from: "another-tab" })).toBe(false);
    other.close();
    stop();
  });
});
