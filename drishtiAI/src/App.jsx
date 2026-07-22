import { useState } from 'react'
import { TooltipProvider } from './context/TooltipContext.jsx'
import { DashboardFiltersProvider } from './context/DashboardFiltersContext.jsx'
import TopBar from './components/TopBar.jsx'
import Rail from './components/Rail.jsx'
import FilterStrip from './components/FilterStrip.jsx'
import DrillModal from './components/DrillModal.jsx'
import Overview from './views/Overview.jsx'
import DeepInsights from './views/DeepInsights.jsx'
import Forecast from './views/Forecast.jsx'
import Genie from './views/Genie.jsx'
import Research from './views/Research.jsx'

export default function App() {
  const [activeFn, setActiveFn] = useState('Service')
  const [activeView, setActiveView] = useState('overview')
  const [selectedPillar, setSelectedPillar] = useState(0)
  const [drill, setDrill] = useState({ open: false, pillarIndex: null, key: null, detailApiPath: null })
  const [prefillQuestion, setPrefillQuestion] = useState('')

  const handleSetFn = (label, key) => {
    setActiveFn(label)
    if (!key) return // Brand / Product — visual switch only, no panel wired yet
  }

  // pillar 3 (Forecast) has its own dedicated tab, not a Deep Insights pane
  const handleGoDeep = (pillarIndex) => {
    console.log('[App] handleGoDeep', {
      pillarIndex,
      destination: pillarIndex === 3 ? 'forecast' : 'deep',
      reason: pillarIndex === 3
        ? 'forecast pillar routes to dedicated forecast view'
        : 'bucket click fell back to deep view or card body was clicked',
    })

    if (pillarIndex === 3) {
      setActiveView('forecast')
      return
    }
    setSelectedPillar(pillarIndex)
    setActiveView('deep')
  }

  const handleOpenDrill = (pillarIndex, key, detailApiPath = null) => {
    console.log('[App] handleOpenDrill', {
      pillarIndex,
      drillKey: key ?? null,
      detailApiPath,
      hasDrillKey: !!key,
      hasDetailApiPath: !!detailApiPath,
      reason: key || detailApiPath
        ? 'opening drill modal because bucket supplied drillKey or detailApiPath'
        : 'unexpected call with no drill payload',
    })

    setDrill({ open: true, pillarIndex, key, detailApiPath })
  }
  const handleCloseDrill = () => setDrill((d) => ({ ...d, open: false }))

  const handleAskAI = (question) => {
    setPrefillQuestion(question)
    setActiveView('genie')
  }

  return (
    <TooltipProvider>
      <DashboardFiltersProvider>
        <div className="flex flex-col min-h-screen">
        <TopBar activeFn={activeFn} onSetFn={handleSetFn} />

        <div className="flex flex-1 min-h-0">
          <Rail activeView={activeView} onSetView={setActiveView} />

          <main className="flex-1 min-w-0 overflow-y-auto">
            <FilterStrip />

            {activeFn === 'Service' ? (
              <>
                {activeView === 'overview' && (
                  <Overview onOpenDrill={handleOpenDrill} onGoDeep={handleGoDeep} onAskAI={handleAskAI} />
                )}
                {activeView === 'deep' && (
                  <DeepInsights
                    selectedPillar={selectedPillar}
                    onSelectPillar={setSelectedPillar}
                    onGoForecast={() => setActiveView('forecast')}
                    onAskAI={handleAskAI}
                  />
                )}
                {activeView === 'forecast' && <Forecast onGoDeep={handleGoDeep} onAskAI={handleAskAI} />}
                {activeView === 'genie' && <Genie prefillQuestion={prefillQuestion} />}
                {activeView === 'research' && <Research />}
              </>
            ) : (
              <div className="max-w-[1280px] mx-auto px-[30px] py-20 text-center">
                <p className="font-mono text-sm text-inkfaint">{activeFn} panel isn't wired up yet — Service is the only fully built function for now.</p>
              </div>
            )}
          </main>
        </div>

        <div className="max-w-[1280px] mx-auto px-[30px] pb-10 flex justify-between font-mono text-[9.5px] tracking-wide text-inkfaint w-full">
          <span>DRISHTI AI · CONSUMER &amp; PRODUCT INTELLIGENCE HUB · PANEL v4</span>
          <span>SOURCES: CRM · WORK ORDER · SAP · STACKLINE · FLIPKART (89,520) · LOCOBUZZ · MOENGAGE · IMD</span>
        </div>

        <DrillModal
          open={drill.open}
          pillarIndex={drill.pillarIndex}
          drillKey={drill.key}
          detailApiPath={drill.detailApiPath}
          onClose={handleCloseDrill}
          onGoDeep={handleGoDeep}
        />
      </div>
      </DashboardFiltersProvider>
    </TooltipProvider>
  )
}