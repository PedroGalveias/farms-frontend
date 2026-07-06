"use client";

import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * On-device haptics diagnostic. Each row triggers one candidate technique for
 * the iOS "switch control" haptic; tap them one by one and note which produce
 * a physical tick. Row 1 is the ground truth: a real, visible switch toggled
 * by your finger — if THAT doesn't tick, the device/OS is the blocker
 * (needs iOS 17.4+, Settings → Sounds & Haptics → System Haptics ON, and no
 * Low Power Mode), and no web technique can work.
 */

function makeSwitch(): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  return input;
}

type Variant = {
  id: string;
  name: string;
  detail: string;
  run: () => void;
};

const VARIANTS: Variant[] = [
  {
    id: "app",
    name: "B — Current app implementation",
    detail:
      "lib/haptics haptic(): full-size in-viewport switch at 2% opacity, input.click()",
    run: () => haptic(),
  },
  {
    id: "clipped",
    name: "H — Previous implementation (1px-clipped label.click())",
    detail: "Switch inside a 1×1px overflow-hidden label; the label is clicked",
    run: () => {
      let label = document.querySelector<HTMLLabelElement>("#lab-clipped");
      if (!label) {
        label = document.createElement("label");
        label.id = "lab-clipped";
        label.style.cssText =
          "position:fixed;bottom:0;left:0;width:1px;height:1px;overflow:hidden;z-index:-1;pointer-events:none";
        label.appendChild(makeSwitch());
        document.body.appendChild(label);
      }
      label.click();
    },
  },
  {
    id: "bare",
    name: "C — Bare input.click(), attach → click → remove",
    detail:
      "Unstyled input[switch] appended to body, clicked, removed next frame",
    run: () => {
      const input = makeSwitch();
      document.body.appendChild(input);
      input.click();
      requestAnimationFrame(() => input.remove());
    },
  },
  {
    id: "offscreen-input",
    name: "D — Off-screen input.click()",
    detail:
      "input[switch] at left:-9999px (persistent), input clicked directly",
    run: () => {
      let input = document.querySelector<HTMLInputElement>("#lab-offscreen");
      if (!input) {
        input = makeSwitch();
        input.id = "lab-offscreen";
        input.style.cssText = "position:fixed;top:0;left:-9999px";
        document.body.appendChild(input);
      }
      input.click();
    },
  },
  {
    id: "display-none",
    name: "E — display:none label.click()",
    detail: "Switch inside a display:none label, label clicked",
    run: () => {
      let label = document.querySelector<HTMLLabelElement>("#lab-dnone");
      if (!label) {
        label = document.createElement("label");
        label.id = "lab-dnone";
        label.style.display = "none";
        label.appendChild(makeSwitch());
        document.body.appendChild(label);
      }
      label.click();
    },
  },
  {
    id: "opacity-0",
    name: "F — opacity:0 in-viewport input.click()",
    detail: "Full-size switch at bottom-left, opacity 0, input clicked",
    run: () => {
      let input = document.querySelector<HTMLInputElement>("#lab-opacity");
      if (!input) {
        input = makeSwitch();
        input.id = "lab-opacity";
        input.style.cssText =
          "position:fixed;bottom:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(input);
      }
      input.click();
    },
  },
  {
    id: "vibrate",
    name: "G — navigator.vibrate(10)",
    detail: "The standard Vibration API (Android; historically absent on iOS)",
    run: () => {
      try {
        navigator.vibrate?.(10);
      } catch {
        /* unsupported */
      }
    },
  },
];

export default function HapticsLab() {
  const [supportsSwitch, setSupportsSwitch] = useState<boolean | null>(null);
  const [supportsVibrate, setSupportsVibrate] = useState<boolean | null>(null);
  const [ua, setUa] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const visibleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSupportsSwitch("switch" in document.createElement("input"));
      setSupportsVibrate(typeof navigator.vibrate === "function");
      setUa(navigator.userAgent);
    });
  }, []);

  const note = (id: string) =>
    setLog((entries) => [
      `${new Date().toLocaleTimeString()} — ran ${id}`,
      ...entries.slice(0, 7),
    ]);

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-black tracking-[-0.04em] text-ink">
        Haptics lab
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/60">
        Internal diagnostic — tap each row on a physical iPhone and note which
        ones produce a physical tick. Start with A: if the real switch below
        doesn&apos;t tick when you toggle it with your finger, the device blocks
        it (needs iOS 17.4+, System Haptics on, no Low Power Mode) and none of
        the others can work.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-cloud p-4 text-xs leading-6 text-ink/70">
        <p>
          <strong>switch control supported:</strong>{" "}
          {supportsSwitch === null ? "…" : supportsSwitch ? "yes" : "NO"}
        </p>
        <p>
          <strong>navigator.vibrate:</strong>{" "}
          {supportsVibrate === null ? "…" : supportsVibrate ? "yes" : "no"}
        </p>
        <p className="break-all">
          <strong>UA:</strong> {ua}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-pine/30 bg-pine/5 p-4">
        <div>
          <p className="text-sm font-bold text-ink">
            A — Real visible switch (ground truth)
          </p>
          <p className="mt-0.5 text-xs text-ink/60">
            Toggle it with your finger — a genuine native switch.
          </p>
        </div>
        <input ref={visibleRef} type="checkbox" {...{ switch: "" }} />
      </div>

      <div className="relative mt-3 rounded-2xl border border-line bg-cloud p-4">
        <p className="text-sm font-bold text-ink">
          I — Real tap on a nearly invisible switch
        </p>
        <p className="mt-0.5 text-xs text-ink/60">
          Tap the faint area on the right — your finger toggles a REAL switch
          rendered at 5% opacity. Tests whether a genuine tap ticks even when
          the switch is (almost) invisible.
        </p>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-dashed border-pine/40 p-2">
          <input
            style={{ opacity: 0.05 }}
            type="checkbox"
            {...{ switch: "" }}
          />
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {VARIANTS.map((variant) => (
          <button
            className="w-full rounded-2xl border border-line bg-cloud p-4 text-left transition hover:border-ink/25 active:scale-[0.99]"
            key={variant.id}
            onClick={() => {
              variant.run();
              note(variant.name);
            }}
            type="button"
          >
            <p className="text-sm font-bold text-ink">{variant.name}</p>
            <p className="mt-0.5 text-xs text-ink/60">{variant.detail}</p>
          </button>
        ))}
      </div>

      {log.length > 0 ? (
        <div className="mt-6 rounded-2xl bg-tone p-4 text-xs leading-6 text-ink/70">
          {log.map((entry) => (
            <p key={entry}>{entry}</p>
          ))}
        </div>
      ) : null}
    </main>
  );
}
