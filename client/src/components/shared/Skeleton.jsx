import React from 'react'

export const Skeleton = ({ className }) => (
  <div className={`bg-white/5 animate-pulse rounded-sm ${className}`} />
)

export const DashboardSkeleton = () => (
  <div className="animate-reveal">
    {/* Header Skeleton */}
    <div className="mb-24">
      <Skeleton className="h-3 w-32 mb-4" />
      <Skeleton className="h-16 w-96 mb-6" />
      <Skeleton className="h-4 w-128" />
    </div>

    {/* Metrics Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-24">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-surface p-8 h-40 flex flex-col justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-20" />
        </div>
      ))}
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border border-white/5">
      <div className="bg-surface p-12 h-64">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="bg-surface p-12 h-64">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </div>
)
