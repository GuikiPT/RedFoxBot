export function handleError(error: unknown, context?: string) {
  if (context) {
    console.error(`${context}:`, error);
  } else {
    console.error(error);
  }
}
