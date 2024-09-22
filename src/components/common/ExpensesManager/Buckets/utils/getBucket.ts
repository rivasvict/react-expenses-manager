const getBucket = (
  buckets: Map<string, Map<string, { limit: number }>>,
  category: string,
  yearMonth: string
): { limit: number } | null => {
  const categoryBuckets = buckets.get(category);
  if (!categoryBuckets) return null;

  if (categoryBuckets.has(yearMonth)) {
    return categoryBuckets.get(yearMonth) || null;
  }

  // Find the most recent past bucket
  const months = Array.from(categoryBuckets.keys()).sort();
  for (let i = months.length - 1; i >= 0; i--) {
    if (months[i] <= yearMonth) {
      return categoryBuckets.get(months[i]) || null;
    }
  }

  return null;
};

export default getBucket;
