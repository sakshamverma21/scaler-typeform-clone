import { Builder } from "@/features/builder/builder";

export default async function BuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  return <Builder id={id} startWithPicker={(await searchParams).new === "1"} />;
}
