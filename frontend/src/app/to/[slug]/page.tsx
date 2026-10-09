import { PublicRespondent } from "@/features/respondent/public-respondent";
export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicRespondent slug={slug} />;
}
