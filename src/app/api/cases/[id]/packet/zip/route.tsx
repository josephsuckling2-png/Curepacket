import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import JSZip from "jszip";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { buildPacketPayload } from "@/lib/packet-data";
import { PacketDocument } from "@/lib/packet-document";
import { packetAccessForCase } from "@/lib/access";
import { notifyPacketReady } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const access = await packetAccessForCase(id, session.user.organizationId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, paywall: true }, { status: 402 });
  }

  const payload = await buildPacketPayload(id, session.user.organizationId);
  if (!payload) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const priorExports = await prisma.packetExport.count({ where: { caseId: id } });
  const pdf = await renderToBuffer(<PacketDocument data={payload} />);
  const zip = new JSZip();
  zip.file("packet.json", JSON.stringify(payload, null, 2));
  zip.file("packet.pdf", pdf);
  zip.file("README.txt", `${payload.disclaimer}\n\nGenerated ${payload.generatedAt}\n`);
  const archive = await zip.generateAsync({ type: "uint8array" });

  await prisma.packetExport.create({ data: { caseId: id } });
  await addChangelog(id, "Evidence packet ZIP exported.", session.user.name);
  if (priorExports === 0) {
    await notifyPacketReady({
      organizationId: session.user.organizationId,
      caseId: id,
      clientName: payload.case.clientName,
    });
  }

  return new NextResponse(Buffer.from(archive), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="curepacket-${payload.case.clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.zip"`,
    },
  });
}
