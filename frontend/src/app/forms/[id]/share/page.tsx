import { FormManagement } from "@/features/form-management/form-management";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormManagement id={id} section="share" />;
}
