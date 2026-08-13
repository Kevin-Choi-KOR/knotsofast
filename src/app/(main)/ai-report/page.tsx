import { PageHeader } from '@/shared/components/PageHeader'

export default function Page() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="AI 운항 리포트" />
      <div className="flex-1 overflow-y-auto p-6" />
    </div>
  )
}
