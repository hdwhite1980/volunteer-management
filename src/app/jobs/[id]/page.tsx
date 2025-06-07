// src/app/jobs/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import JobDetails from '@/components/JobDetails';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  return <JobDetails jobId={jobId} />;
}