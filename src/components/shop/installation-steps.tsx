import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'

const STEPS = [
  {
    image: '/step1.webp',
    title: 'Découpez le panneau à la dimension souhaitée',
    text: "Mesurez la surface à couvrir puis découpez le panneau à l'aide d'une scie adaptée ou d'un cutter selon le matériau. L'installation ne nécessite aucun outil professionnel.",
  },
  {
    image: '/step2.webp',
    title: 'Appliquez la colle PL500',
    text: 'Appliquez la colle PL500 en lignes ou en points réguliers au dos du panneau afin d’assurer une fixation solide et durable sur tous types de murs propres et secs.',
  },
  {
    image: '/step3.webp',
    title: 'Positionnez et fixez au mur',
    text: 'Placez le panneau contre le mur, ajustez si nécessaire, puis appuyez fermement pendant quelques minutes pour garantir une adhérence parfaite.',
  },
]

type InstallationStepsProps = {
  step3Image?: string
}

export default function InstallationSteps({ step3Image = '/step3.webp' }: InstallationStepsProps) {
  const steps = useMemo(
    () =>
      STEPS.map((step, index) =>
        index === 2
          ? {
              ...step,
              image: step3Image,
            }
          : step
      ),
    [step3Image]
  )
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [mobileCardHeight, setMobileCardHeight] = useState<number>(0)
  const sectionRef = useRef<HTMLElement | null>(null)
  const measureCardRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || hasStarted) return

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)
        if (isVisible) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    const computeHeight = () => {
      const maxHeight = measureCardRefs.current.reduce((acc, node) => {
        if (!node) return acc
        return Math.max(acc, node.offsetHeight)
      }, 0)
      if (maxHeight > 0) setMobileCardHeight(maxHeight)
    }

    computeHeight()
    window.addEventListener('resize', computeHeight)
    return () => window.removeEventListener('resize', computeHeight)
  }, [steps])

  useEffect(() => {
    if (!hasStarted) return
    const durationMs = 4000
    const tickMs = 50
    let currentStep = 0
    let startedAt = Date.now()

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, (elapsed / durationMs) * 100)
      setProgress(nextProgress)

      if (elapsed >= durationMs) {
        currentStep = (currentStep + 1) % steps.length
        setActiveStep(currentStep)
        setProgress(0)
        startedAt = Date.now()
      }
    }, tickMs)

    return () => window.clearInterval(timer)
  }, [hasStarted, steps.length])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="installation-steps-heading"
      className="relative mx-auto max-w-[1400px] px-4 py-4 lg:py-6"
    >
      <h2 id="installation-steps-heading" className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">
        {'Installation Facile en 3 Étapes'}
      </h2>

      <ol className="grid grid-cols-1 gap-10 lg:grid-cols-3 max-md:hidden">
        {steps.map((step, index) => (
          <li key={step.title} className="flex h-full flex-col">
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={step.image}
                  alt={`Étape ${index + 1} - ${step.title}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>

              <div className="flex flex-grow flex-col p-6">
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
                  Étape {index + 1}
                </p>
                <h3 className="mb-2 min-h-[2rem] text-lg font-semibold leading-tight">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <div className="md:hidden">
        <article
          className="overflow-hidden rounded-2xl border border-border bg-card"
          style={mobileCardHeight > 0 ? { height: `${mobileCardHeight}px` } : undefined}
        >
          <div className="relative h-[calc(100%-6px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 12, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -12, scale: 0.985 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={steps[activeStep].image}
                    alt={`Étape ${activeStep + 1} - ${steps[activeStep].title}`}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>

                <div className="flex flex-grow flex-col p-6 pb-4">
                  <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
                    Étape {activeStep + 1}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold leading-tight">{steps[activeStep].title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{steps[activeStep].text}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-1.5 w-full bg-muted/70">
            <div
              className="h-full bg-accent transition-[width] duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </article>
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-0 -z-10 opacity-0 md:hidden" aria-hidden="true">
        {steps.map((step, index) => (
          <article
            key={`measure-${step.title}`}
            ref={(node) => {
              measureCardRefs.current[index] = node
            }}
            className="mb-3 overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={step.image}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="p-6 pb-4">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">Étape {index + 1}</p>
              <h3 className="mb-2 text-lg font-semibold leading-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
            <div className="h-1.5 w-full bg-muted/70" />
          </article>
        ))}
      </div>
    </section>
  )
}
