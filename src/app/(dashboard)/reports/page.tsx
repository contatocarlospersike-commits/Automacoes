import { getReportsData } from '@/features/reports/actions'
import { ReportsDashboard } from '@/features/reports/reports-dashboard'

export default async function ReportsPage() {
  const data = await getReportsData('30d')

  return <ReportsDashboard initialData={data} initialPeriod="30d" />
}
