import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ rest: ["not-found"] }];
}

export default function CatchAllNotFound(): never {
  notFound();
}
