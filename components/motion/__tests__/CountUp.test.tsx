import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CountUp from "@/components/motion/CountUp";

describe("CountUp server rendering", () => {
  it("renders the real value without waiting for JavaScript", () => {
    expect(renderToString(<CountUp value={3155} />)).toContain("3155");
  });
});
