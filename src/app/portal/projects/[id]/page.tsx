import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getClientContext, getPortalData } from "@/lib/portal";
import { ProjectSpaceView } from "@/components/portal/PortalViews";

export const dynamic = "force-dynamic";

export default async function PortalProjectSpace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { client, projects } = await getClientContext();
  const project = projects.find((item) => item.id === id);
  if (!project) notFound();

  const data = await getPortalData(client?.id ?? null, user.id);
  return <ProjectSpaceView project={project} data={data} />;
}
