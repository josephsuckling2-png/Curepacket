import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { buildPacketPayload } from "@/lib/packet-data";
import { PacketDocument } from "@/lib/packet-document";
import { packetAccessForCase } from "@/lib/access";
import { notifyPacketReady } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const owned = await prisma.case.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!owned) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  let markReady = false;
  try {
    const body = await request.json();
    markReady = Boolean(body?.markReady);
  } catch {
    markReady = true;
  }

  if (markReady) {
    const wasReady = owned.status === "packet_ready";
    await prisma.case.update({ where: { id }, data: { status: "packet_ready" } });
    await addChangelog(id, "Case marked packet ready.", session.user.name);
    if (!wasReady) {
      await notifyPacketReady({
        organizationId: session.user.organizationId,
        caseId: id,
        clientName: owned.clientName,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

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
  const buffer = await renderToBuffer(<PacketDocument data={payload} />);
  await prisma.packetExport.create({ data: { caseId: id } });
  await addChangelog(id, "Evidence packet PDF exported.", session.user.name);
  if (priorExports === 0) {
    await notifyPacketReady({
      organizationId: session.user.organizationId,
      caseId: id,
      clientName: payload.case.clientName,
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="curepacket-${payload.case.clientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.pdf"`,
    },
  });
}
