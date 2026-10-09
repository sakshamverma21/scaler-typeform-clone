import { PreviewPage } from "@/features/builder/preview";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PreviewPage id={id} />;
}
