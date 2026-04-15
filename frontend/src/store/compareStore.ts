import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Property {
  _id: string
  title: string
  price: number
  location: {
    city: string
    state: string
    address: string
  }
  type: string
  specifications: {
    bedrooms: number
    bathrooms: number
    area: number
  }
  amenities: string[]
  images?: string[]
}

interface CompareState {
  compareList: Property[]
  addToCompare: (property: Property) => void
  removeFromCompare: (id: string) => void
  clearCompare: () => void
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set) => ({
      compareList: [],
      addToCompare: (property) =>
        set((state) => {
          if (state.compareList.length >= 4) {
            alert('You can compare up to 4 properties at a time')
            return state
          }
          if (state.compareList.some((p) => p._id === property._id)) {
            return state
          }
          return { compareList: [...state.compareList, property] }
        }),
      removeFromCompare: (id) =>
        set((state) => ({
          compareList: state.compareList.filter((p) => p._id !== id),
        })),
      clearCompare: () => set({ compareList: [] }),
    }),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

