import { GroupWorkspace } from "@/components/workshop/group-workspace"

type PageProps = {
  params: Promise<{
    groupId: string
  }>
}

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params

  return <GroupWorkspace groupId={groupId} />
}