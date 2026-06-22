import type { Metadata } from "next";
import SeasonalCalendar from "@/components/SeasonalCalendar";

export const metadata: Metadata = {
  title: "Seasonal calendar",
  description: "What's growing in Switzerland, month by month.",
};

export default function SeasonalPage() {
  return <SeasonalCalendar />;
}
