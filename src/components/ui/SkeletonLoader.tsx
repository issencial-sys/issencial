"use client";

interface SkeletonLoaderProps {
  type?: "card" | "list" | "table" | "text" | "profile" | "chat";
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  type = "text",
  count = 1,
  className = "",
}: SkeletonLoaderProps) {
  const renderItem = (i: number) => {
    switch (type) {
      case "card":
        return (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        );
      case "list":
        return (
          <div key={i} className="flex items-center gap-4 p-5 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
          </div>
        );
      case "table":
        return (
          <tr key={i} className="animate-pulse">
            <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
            <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
            <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full" /></td>
            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
            <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded ml-auto" /></td>
          </tr>
        );
      case "profile":
        return (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-8 animate-pulse">
            <div className="flex items-center gap-5 mb-8">
              <div className="h-16 w-16 rounded-full bg-gray-100" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-100 rounded" />
                <div className="h-4 w-56 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          </div>
        );
      case "chat":
        return (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} mb-3 animate-pulse`}>
            <div className={`h-16 ${i % 2 === 0 ? "w-3/4" : "w-1/2"} rounded-2xl bg-gray-100`} />
          </div>
        );
      default:
        return (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => renderItem(i))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <div className="flex gap-8">
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="h-3 w-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }, (_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 w-full bg-gray-100 rounded" style={{ maxWidth: j === 0 ? "60%" : "80%" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
