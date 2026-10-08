import type { Metadata } from "next";
import { renderDesktop } from "@/lib/desktop";

export async function generateMetadata({ params }: PageProps<"/safari/[[...address]]">): Promise<Metadata> {
  const { address } = await params;
  return { title: address?.[0] ? `${decodeURIComponent(address[0])} · Safari` : "Safari · Build any website" };
}

// /safari opens Safari; /safari/bodega-cats.nyc opens that generated site
// (the links people share).
export default async function SafariPage({ params }: PageProps<"/safari/[[...address]]">) {
  const { address } = await params;
  const url = address?.[0] ? decodeURIComponent(address[0]) : undefined;
  return renderDesktop([{ id: "safari", params: url ? { url } : undefined }]);
}
