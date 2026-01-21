/**
 * Concurrency Utility
 * Process items in parallel with a controlled concurrency limit.
 * Unlike Promise.all (which runs everything at once), this limits
 * how many operations run simultaneously.
 */

export interface ConcurrencyOptions<T, R> {
  /** Maximum number of concurrent operations (default: 3) */
  concurrency?: number;
  /** Callback fired after each item completes */
  onProgress?: (completed: number, total: number, result: R) => void;
  /** Callback fired when an item fails (if not provided, errors are collected and thrown at end) */
  onError?: (error: Error, item: T, index: number) => void;
  /** If true, stop processing on first error (default: false) */
  stopOnError?: boolean;
}

export interface ConcurrencyResult<R> {
  results: R[];
  errors: Array<{ index: number; error: Error }>;
}

/**
 * Process items in parallel with concurrency limit
 *
 * @example
 * // Basic usage
 * const results = await processWithConcurrency(
 *   urls,
 *   async (url) => fetch(url).then(r => r.json()),
 *   { concurrency: 3 }
 * );
 *
 * @example
 * // With progress tracking
 * await processWithConcurrency(
 *   items,
 *   async (item) => processItem(item),
 *   {
 *     concurrency: 5,
 *     onProgress: (completed, total) => {
 *       console.log(`${completed}/${total} completed`);
 *     }
 *   }
 * );
 */
export async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: ConcurrencyOptions<T, R> = {}
): Promise<ConcurrencyResult<R>> {
  const {
    concurrency = 3,
    onProgress,
    onError,
    stopOnError = false,
  } = options;

  const results: R[] = new Array(items.length);
  const errors: Array<{ index: number; error: Error }> = [];
  const executing = new Set<Promise<void>>();
  let completed = 0;
  let shouldStop = false;

  for (let i = 0; i < items.length; i++) {
    if (shouldStop) break;

    const item = items[i];
    const index = i;

    const promise: Promise<void> = processor(item, index)
      .then((result) => {
        results[index] = result;
        completed++;
        onProgress?.(completed, items.length, result);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push({ index, error });

        if (onError) {
          onError(error, item, index);
        }

        if (stopOnError) {
          shouldStop = true;
        }
      })
      .finally(() => {
        executing.delete(promise);
      });

    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  // Wait for remaining promises
  await Promise.all(executing);

  return { results, errors };
}

/**
 * Simplified version that throws on any error
 * Returns just the results array (like Promise.all behavior but with concurrency limit)
 */
export async function processWithConcurrencyStrict<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  concurrency = 3
): Promise<R[]> {
  const { results, errors } = await processWithConcurrency(items, processor, {
    concurrency,
    stopOnError: true,
  });

  if (errors.length > 0) {
    throw errors[0].error;
  }

  return results;
}

/**
 * Version that ignores errors and returns only successful results
 * Useful for batch operations where partial success is acceptable
 */
export async function processWithConcurrencyIgnoreErrors<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: Omit<ConcurrencyOptions<T, R>, 'stopOnError'> = {}
): Promise<R[]> {
  const { results, errors } = await processWithConcurrency(items, processor, {
    ...options,
    stopOnError: false,
  });

  // Filter out undefined entries (failed items)
  return results.filter((r): r is R => r !== undefined);
}