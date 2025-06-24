// src/lib/categories.ts - Centralized Category Management

export interface CategoryStructure {
  [key: string]: {
    label: string;
    subcategories: string[];
  };
}

export const VOLUNTEER_CATEGORIES: CategoryStructure = {
  'administration-documentation': {
    label: 'Administration & Documentation',
    subcategories: [
      'Administrative',
      'Data Entry',
      'Documentation',
      'Fundraising',
      'Grant Writing / Story Collection'
    ]
  },
  'construction-repair': {
    label: 'Construction & Repair',
    subcategories: [
      'Heavy Lifting',
      'Construction',
      'Electrical Work',
      'Plumbing',
      'HVAC',
      'Roofing',
      'Debris Removal',
      'Tarp Installation / Temporary Repairs',
      'Damage Documentation / Media Support'
    ]
  },
  'health-safety': {
    label: 'Health & Safety',
    subcategories: [
      'First Aid',
      'Medical Knowledge',
      'Mental Health Support',
      'Crisis Response',
      'Disability Support'
    ]
  },
  'community-support': {
    label: 'Community & Support',
    subcategories: [
      'IT Support',
      'Translation',
      'Elder Care',
      'Childcare',
      'Pet Care',
      'Cleaning',
      'Shelter Support / Intake',
      'Legal Aid Navigation',
      'Phone Banking / Wellness Checks'
    ]
  },
  'education-outreach': {
    label: 'Education & Outreach',
    subcategories: [
      'Comms & Social Media Outreach',
      'Community Awareness / Outreach',
      'Youth Education / Engagement',
      'Homework Help / Learning Support'
    ]
  },
  'logistics': {
    label: 'Logistics',
    subcategories: [
      'Driving',
      'Transportation Coordination',
      'Donation Sorting / Distribution',
      'Digital Support / Form Assistance',
      'Shelter Registration Assistance'
    ]
  }
};

// Flatten categories for form dropdowns
export function getFlatCategoryList(): Array<{ value: string; label: string; parent?: string }> {
  const flatList: Array<{ value: string; label: string; parent?: string }> = [];
  
  Object.entries(VOLUNTEER_CATEGORIES).forEach(([parentKey, category]) => {
    // Add parent category
    flatList.push({
      value: parentKey,
      label: category.label
    });
    
    // Add subcategories
    category.subcategories.forEach(subcat => {
      flatList.push({
        value: `${parentKey}:${subcat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        label: subcat,
        parent: parentKey
      });
    });
  });
  
  return flatList;
}

// Get all subcategories for a parent
export function getSubcategories(parentKey: string): string[] {
  return VOLUNTEER_CATEGORIES[parentKey]?.subcategories || [];
}

// Get parent category label
export function getParentCategoryLabel(parentKey: string): string {
  return VOLUNTEER_CATEGORIES[parentKey]?.label || '';
}

// Parse category value back to parent/subcategory
export function parseCategoryValue(value: string): { parent: string; subcategory?: string } {
  if (value.includes(':')) {
    const [parent, subcat] = value.split(':');
    return { parent, subcategory: subcat };
  }
  return { parent: value };
}

// Get display label for a category value
export function getCategoryDisplayLabel(value: string): string {
  if (value.includes(':')) {
    const [parentKey, subcatKey] = value.split(':');
    const parent = VOLUNTEER_CATEGORIES[parentKey];
    if (parent) {
      const subcategory = parent.subcategories.find(sub => 
        sub.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === subcatKey
      );
      return subcategory || value;
    }
  }
  return VOLUNTEER_CATEGORIES[value]?.label || value;
}

// Legacy category mapping for database compatibility
export const LEGACY_CATEGORY_MAPPING: Record<string, string> = {
  'Environment': 'logistics',
  'Education': 'education-outreach',
  'Human Services': 'community-support',
  'Health': 'health-safety',
  'Community': 'community-support',
  'Arts & Culture': 'education-outreach',
  'Sports & Recreation': 'community-support',
  'Faith-based': 'community-support',
  'Emergency Services': 'health-safety',
  'Technology': 'community-support',
  'Administrative': 'administration-documentation',
  'Construction': 'construction-repair',
  'Events': 'logistics'
};

// Convert legacy category to new format
export function migrateLegacyCategory(legacyCategory: string): string {
  return LEGACY_CATEGORY_MAPPING[legacyCategory] || 'community-support';
}