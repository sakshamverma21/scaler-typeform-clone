import { Builder } from "@/features/builder/builder";

export default async function BuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Builder id={id} />;
}
