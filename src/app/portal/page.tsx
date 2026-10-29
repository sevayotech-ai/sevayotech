import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getClientContext, getPortalData } from "@/lib/portal";
import { OverviewView } from "@/components/portal/PortalViews";

export const dynamic = "force-dynamic";

export default async function PortalOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { client, projects } = await getClientContext();
  const data = await getPortalData(client?.id ?? null, user.id);

  return (
    <OverviewView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        jobTitle: user.jobTitle,
        role: user.role,
      }}
      projects={projects}
      data={data}
    />
  );
}
