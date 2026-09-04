export type BleDiscoveryStatus = "searching" | "found" | "not_found";

export interface DiscoveredSession {
  subjectName: string;
  room: string;
  facultyName: string;
  rssi: number;
}

export function simulateBleDiscovery(
  hasActiveSession: boolean,
  sessionInfo: { subjectName: string; room: string; facultyName: string } | null,
  onUpdate: (status: BleDiscoveryStatus, session?: DiscoveredSession) => void
): () => void {
  let isCancelled = false;

  // Immediate searching state
  onUpdate("searching");

  const timer = setTimeout(() => {
    if (isCancelled) return;

    if (hasActiveSession && sessionInfo) {
      onUpdate("found", {
        subjectName: sessionInfo.subjectName,
        room: sessionInfo.room,
        facultyName: sessionInfo.facultyName,
        rssi: -62, // Strong classroom beacon signal
      });
    } else {
      onUpdate("not_found");
    }
  }, 1600);

  return () => {
    isCancelled = true;
    clearTimeout(timer);
  };
}
