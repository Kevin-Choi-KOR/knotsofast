export interface RiskItem {
  level: 'high' | 'medium' | 'low'
  category: 'weather' | 'geopolitical' | 'port' | 'mechanical'
  title: string
  description: string
}

export interface EcoSpeedReport {
  id: string
  voyageId: string
  generatedAt: string
  recommendedSpeed: number
  currentPlanSpeed: number
  fuelSavingPercent: number
  co2SavedTon: number
  etaIfRecommended: string
  canMeetRta: boolean
  reasoning: string
  risks: RiskItem[]
  aiAnalyzedAt?: string | null
}
