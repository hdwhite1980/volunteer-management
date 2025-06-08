// src/hooks/useCategories.ts
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  category_name: string;
  category_type: 'volunteer' | 'requester';
  description: string;
  display_order: number;
  is_active: boolean;
}

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(type?: 'volunteer' | 'requester', active: boolean = true): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (type) params.append('type', type);
      params.append('active', active.toString());

      const response = await fetch(`/api/categories?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      
      // If type is specified, data is an array. Otherwise, it's grouped by type
      if (type) {
        setCategories(data);
      } else {
        // If fetching all, we might want to combine them or handle differently
        setCategories([...data.volunteer, ...data.requester]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      
      // Fallback to hardcoded categories if database fetch fails
      if (type === 'volunteer') {
        setCategories(getFallbackVolunteerCategories());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [type, active]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
}

// Fallback categories in case database is not available
function getFallbackVolunteerCategories(): Category[] {
  return [
    { id: 1, category_name: 'Debris Removal & Cleanup', category_type: 'volunteer', description: '', display_order: 1, is_active: true },
    { id: 2, category_name: 'Structural Assessment & Repair', category_type: 'volunteer', description: '', display_order: 2, is_active: true },
    { id: 3, category_name: 'Home Stabilization (e.g., tarping, boarding)', category_type: 'volunteer', description: '', display_order: 3, is_active: true },
    { id: 4, category_name: 'Utility Restoration Support', category_type: 'volunteer', description: '', display_order: 4, is_active: true },
    { id: 5, category_name: 'Supply Distribution', category_type: 'volunteer', description: '', display_order: 5, is_active: true },
    { id: 6, category_name: 'Warehouse Management', category_type: 'volunteer', description: '', display_order: 6, is_active: true },
    { id: 7, category_name: 'Transportation Assistance', category_type: 'volunteer', description: '', display_order: 7, is_active: true },
    { id: 8, category_name: 'Administrative & Office Support', category_type: 'volunteer', description: '', display_order: 8, is_active: true },
    { id: 9, category_name: 'First Aid & Medical Support', category_type: 'volunteer', description: '', display_order: 9, is_active: true },
    { id: 10, category_name: 'Mental Health & Emotional Support', category_type: 'volunteer', description: '', display_order: 10, is_active: true },
    { id: 11, category_name: 'Spiritual Care', category_type: 'volunteer', description: '', display_order: 11, is_active: true },
    { id: 12, category_name: 'Pet Care Services', category_type: 'volunteer', description: '', display_order: 12, is_active: true },
    { id: 13, category_name: 'Childcare & Youth Programs', category_type: 'volunteer', description: '', display_order: 13, is_active: true },
    { id: 14, category_name: 'Senior Assistance', category_type: 'volunteer', description: '', display_order: 14, is_active: true },
    { id: 15, category_name: 'Multilingual & Translation Support', category_type: 'volunteer', description: '', display_order: 15, is_active: true },
    { id: 16, category_name: 'Legal Aid Assistance', category_type: 'volunteer', description: '', display_order: 16, is_active: true },
    { id: 17, category_name: 'Volunteer Coordination', category_type: 'volunteer', description: '', display_order: 17, is_active: true },
    { id: 18, category_name: 'IT & Communication Support', category_type: 'volunteer', description: '', display_order: 18, is_active: true },
    { id: 19, category_name: 'Damage Assessment & Reporting', category_type: 'volunteer', description: '', display_order: 19, is_active: true },
    { id: 20, category_name: 'Fundraising & Community Outreach', category_type: 'volunteer', description: '', display_order: 20, is_active: true }
  ];
}