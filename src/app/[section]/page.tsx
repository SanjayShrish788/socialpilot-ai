import { notFound } from "next/navigation";
import { sections, type Section } from "@/lib/workspace";
import { SectionPage } from "@/components/section-page";

type Props = { params: Promise<{ section: string }> };

function getSection(value: string): Section {
  if (!Object.hasOwn(sections, value)) notFound();
  return value as Section;
}

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export async function generateMetadata({ params }: Props) {
  return sections[getSection((await params).section)];
}

export default async function Page({ params }: Props) {
  return <SectionPage section={getSection((await params).section)} />;
}
