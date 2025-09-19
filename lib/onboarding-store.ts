import { create } from 'zustand';
import { LayerCategory, LayerType } from '../types/database';

export interface SelectedLayer {
  category: LayerCategory;
  type: LayerType;
  tagline: string;
  photos: string[];
  isPrimary?: boolean;
}

interface OnboardingState {
  displayName: string;
  age: number | null;
  bio: string;
  selectedLayers: SelectedLayer[];
  privacyStrategy: 'mysterious' | 'balanced' | 'open';
  currentStep: number;
  
  setDisplayName: (name: string) => void;
  setAge: (age: number) => void;
  setBio: (bio: string) => void;
  addLayer: (layer: SelectedLayer) => void;
  removeLayer: (index: number) => void;
  updateLayerPhotos: (index: number, photos: string[]) => void;
  setPrivacyStrategy: (strategy: 'mysterious' | 'balanced' | 'open') => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  displayName: '',
  age: null,
  bio: '',
  selectedLayers: [],
  privacyStrategy: 'balanced',
  currentStep: 0,
  
  setDisplayName: (name) => set({ displayName: name }),
  setAge: (age) => set({ age }),
  setBio: (bio) => set({ bio }),
  addLayer: (layer) => set((state) => ({
    selectedLayers: [...state.selectedLayers, layer]
  })),
  removeLayer: (index) => set((state) => ({
    selectedLayers: state.selectedLayers.filter((_, i) => i !== index)
  })),
  updateLayerPhotos: (index, photos) => set((state) => ({
    selectedLayers: state.selectedLayers.map((layer, i) =>
      i === index ? { ...layer, photos } : layer
    )
  })),
  setPrivacyStrategy: (strategy) => set({ privacyStrategy: strategy }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  reset: () => set({
    displayName: '',
    age: null,
    bio: '',
    selectedLayers: [],
    privacyStrategy: 'balanced',
    currentStep: 0,
  }),
});