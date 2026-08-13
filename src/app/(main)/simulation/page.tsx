import { PageHeader } from '@/shared/components/PageHeader'

export default function Page() {
  return (
    <div className="flex h-full flex-col">
      <PageHeader title="물류 시뮬레이션" />
      <div className="flex-1 overflow-y-auto p-6" />
    </div>
  )
}
