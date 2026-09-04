import confetti from 'canvas-confetti';

export type FaceScanStatus = "idle" | "scanning" | "aligning" | "verified" | "failed";

export function simulateFaceScan(
  onStatusChange: (status: FaceScanStatus, confidence: number) => void,
  shouldSucceed: boolean = true
): () => void {
  let isCancelled = false;

  // 1. Start scanning
  onStatusChange("scanning", 35);

  const t1 = setTimeout(() => {
    if (isCancelled) return;
    // 2. Face aligned in oval
    onStatusChange("aligning", 72);
  }, 1200);

  const t2 = setTimeout(() => {
    if (isCancelled) return;
    if (shouldSucceed) {
      // 3. Match verified
      onStatusChange("verified", 98);
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#4F46E5', '#7C3AED', '#F59E0B']
        });
      } catch {
        // Fallback if canvas-confetti is not rendered
      }
    } else {
      onStatusChange("failed", 48);
    }
  }, 2400);

  return () => {
    isCancelled = true;
    clearTimeout(t1);
    clearTimeout(t2);
  };
}
