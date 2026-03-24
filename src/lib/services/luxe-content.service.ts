import {
  aboutNarrative,
  aboutValues,
  featuredProducts,
  homeCategories,
  luxeNav,
  studioMembers,
  trustItems,
} from '@/lib/mockData'

// Local service layer to keep presentation detached from any direct DB or backend calls.
export async function getHomeContent() {
  return {
    nav: luxeNav,
    categories: homeCategories,
    products: featuredProducts,
    trustItems,
  }
}

export async function getAboutContent() {
  return {
    nav: luxeNav,
    narrative: aboutNarrative,
    values: aboutValues,
    members: studioMembers,
  }
}
