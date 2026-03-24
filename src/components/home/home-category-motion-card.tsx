'use client'

import { motion, type Transition, type Variants } from 'framer-motion'
import HomeCategoryCard, { type HomeCategoryItem } from './home-category-card'

type HomeCategoryMotionCardProps = {
  category: HomeCategoryItem
  variants?: Variants
  transition?: Transition
  className?: string
  mobile?: boolean
}

export default function HomeCategoryMotionCard({
  category,
  variants,
  transition,
  className,
  mobile = false,
}: HomeCategoryMotionCardProps) {
  return (
    <motion.div className={className} variants={variants} transition={transition}>
      <HomeCategoryCard category={category} mobile={mobile} />
    </motion.div>
  )
}
