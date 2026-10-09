import { FormOverview } from "@/features/dashboard/form-overview";

export default async function BuildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormOverview id={id} />;
}
