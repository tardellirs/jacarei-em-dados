import type { DashboardData } from '../../types'
import { SexDistribution } from '../SexDistribution'
import { AgePyramid } from '../AgePyramid'

interface DemografiaViewProps {
  data: DashboardData
}

export function DemografiaView({ data }: DemografiaViewProps) {
  return (
    <>
      <SexDistribution data={data} />
      <AgePyramid data={data} />
    </>
  )
}
