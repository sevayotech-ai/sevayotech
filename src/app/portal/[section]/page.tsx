import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getClientContext, getPortalData } from "@/lib/portal";
import {
  DocumentsView,
  IdeasView,
  InvoicesView,
  MeetingsView,
  MessagesView,
  MilestonesView,
  NotificationsView,
  PaymentsView,
  ProfileView,
  ProjectsView,
  RequirementsView,
  TasksView,
} from "@/components/portal/PortalViews";

export const dynamic = "force-dynamic";

const SECTIONS = [
  "projects",
  "ideas",
  "requirements",
  "tasks",
  "milestones",
  "documents",
  "messages",
  "meetings",
  "payments",
  "invoices",
  "notifications",
  "profile",
] as const;

type SectionKey = (typeof SECTIONS)[number];

export default async function PortalSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section as SectionKey)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { client, projects } = await getClientContext();
  const data = await getPortalData(client?.id ?? null, user.id);

  const userProps = {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    phone: user.phone,
    jobTitle: user.jobTitle,
    role: user.role,
  };

  switch (section as SectionKey) {
    case "projects":
      return <ProjectsView projects={projects} data={data} />;
    case "ideas":
      return <IdeasView data={data} />;
    case "requirements":
      return <RequirementsView data={data} />;
    case "tasks":
      return <TasksView data={data} projects={projects} />;
    case "milestones":
      return <MilestonesView data={data} />;
    case "documents":
      return <DocumentsView data={data} />;
    case "messages":
      return <MessagesView data={data} projects={projects} />;
    case "meetings":
      return <MeetingsView data={data} />;
    case "payments":
      return <PaymentsView data={data} />;
    case "invoices":
      return <InvoicesView data={data} />;
    case "notifications":
      return <NotificationsView data={data} />;
    case "profile":
      return <ProfileView user={userProps} />;
    default:
      notFound();
  }
}
