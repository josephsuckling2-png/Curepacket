import os from "os";
import path from "path";

/** Scan screenshots live on the instance's temp disk and disappear when the container is replaced. */
export function screenshotDirectory(caseId: string) {
  return path.join(os.tmpdir(), "curepacket", "screenshots", caseId);
}

export function screenshotFilePath(caseId: string, file: string) {
  return path.join(screenshotDirectory(caseId), file);
}
