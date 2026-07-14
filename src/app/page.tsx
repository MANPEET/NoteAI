import { Navbar } from '@/components/home/Navbar'
import { Hero } from '@/components/home/Hero'
import { DemosSection } from '@/components/home/demos-section'
import { FeaturesBento } from '@/components/home/features-bento'
import { Pricing } from '@/components/home/pricing'
import { Footer } from '@/components/home/footer'

export default function Page() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <DemosSection />
      <FeaturesBento /> 
      <Pricing />
      <Footer />  
    </main>
  )
}
