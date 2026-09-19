import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PacketPayload } from "@/lib/packet-data";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Times-Roman",
    color: "#1b2429",
    backgroundColor: "#fbf8f2",
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#b56a32",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Times-Bold",
    color: "#0c1a22",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#3d4f5a",
    marginBottom: 16,
  },
  rule: {
    height: 1,
    backgroundColor: "#d7cbb8",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Times-Bold",
    marginBottom: 8,
    color: "#0c1a22",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: "#5c6e79",
  },
  value: {
    flex: 1,
    fontFamily: "Times-Bold",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d7cbb8",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  disclaimer: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: "#3d4f5a",
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d7cbb8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9,
    marginRight: 8,
  },
  issueHead: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    marginBottom: 3,
  },
  muted: {
    color: "#5c6e79",
    fontSize: 9,
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#5c6e79",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "—"}</Text>
    </View>
  );
}

export function PacketDocument({ data }: { data: PacketPayload }) {
  return (
    <Document
      title={`CurePacket — ${data.case.clientName}`}
      author={data.organization.name}
      subject="Accessibility remediation evidence packet"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.kicker}>CurePacket evidence packet</Text>
        <Text style={styles.title}>{data.case.clientName}</Text>
        <Text style={styles.subtitle}>
          Prepared by {data.organization.name} · Generated {data.generatedAt}
        </Text>
        <View style={styles.box}>
          <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        </View>
        <View style={styles.rule} />
        <Text style={styles.sectionTitle}>Case metadata</Text>
        <Field label="Client" value={data.case.clientName} />
        <Field label="Client email" value={data.case.clientEmail} />
        <Field label="Site" value={data.case.siteUrl} />
        <Field label="Case status" value={data.case.status} />
        <Field label="Cure window / deadline" value={data.case.deadlineAt} />
        <Field label="Opened" value={data.case.createdAt} />
        <Text style={styles.footer}>
          <Text>CurePacket · documentation, not legal advice</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Demand letter summary</Text>
        {data.letter ? (
          <>
            <Field label="Sender" value={data.letter.sender} />
            <Field label="Date received" value={data.letter.dateReceived} />
            <Field label="Notes" value={data.letter.notes} />
            <View style={{ marginTop: 8 }}>
              <Text style={styles.muted}>Alleged issues</Text>
              {(data.letter.allegedIssues.length ? data.letter.allegedIssues : ["None recorded"]).map(
                (item) => (
                  <Text key={item}>• {item}</Text>
                ),
              )}
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.muted}>Listed URLs</Text>
              {(data.letter.listedUrls.length ? data.letter.listedUrls : ["None recorded"]).map(
                (item) => (
                  <Text key={item}>• {item}</Text>
                ),
              )}
            </View>
          </>
        ) : (
          <Text>No demand-letter intake has been saved for this case.</Text>
        )}
        <View style={styles.rule} />
        <Text style={styles.sectionTitle}>Scan summary</Text>
        {data.scan ? (
          <>
            <Field label="Scan status" value={data.scan.status} />
            <Field label="Started" value={data.scan.startedAt} />
            <Field label="Completed" value={data.scan.completedAt} />
            <Field label="Pages scanned" value={String(data.scan.pagesScanned)} />
            <View style={{ marginTop: 8 }}>
              <Text style={styles.muted}>Pages</Text>
              {(data.scan.pages.length ? data.scan.pages : ["Not recorded"]).map((item) => (
                <Text key={item}>• {item}</Text>
              ))}
            </View>
          </>
        ) : (
          <Text>No scan has been recorded yet.</Text>
        )}
        <View style={styles.chipRow}>
          <Text style={styles.chip}>Total {data.counts.total}</Text>
          <Text style={styles.chip}>Open {data.counts.open}</Text>
          <Text style={styles.chip}>In progress {data.counts.inProgress}</Text>
          <Text style={styles.chip}>Fixed {data.counts.fixed}</Text>
          <Text style={styles.chip}>Won&apos;t fix {data.counts.wontFix}</Text>
        </View>
        <Text style={styles.footer}>
          <Text>CurePacket · documentation, not legal advice</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Issue register</Text>
        {data.issues.length === 0 ? (
          <Text>No issues stored for this case.</Text>
        ) : (
          data.issues.map((issue, index) => (
            <View key={issue.id} style={styles.box} wrap={false}>
              <Text style={styles.issueHead}>
                {index + 1}. [{issue.severity}] {issue.help}
              </Text>
              <Text style={styles.muted}>
                {issue.wcagRule ? `WCAG ${issue.wcagRule} · ` : ""}
                {issue.ruleId} · {issue.status}
              </Text>
              <Text style={styles.muted}>{issue.pageUrl}</Text>
              {issue.selector ? <Text style={styles.muted}>Selector: {issue.selector}</Text> : null}
              {issue.snippet ? <Text style={styles.muted}>Snippet: {issue.snippet}</Text> : null}
              {issue.beforeNotes ? <Text>Before: {issue.beforeNotes}</Text> : null}
              {issue.afterNotes ? <Text>After: {issue.afterNotes}</Text> : null}
              {issue.fixedAt ? <Text>Marked fixed: {issue.fixedAt}</Text> : null}
            </View>
          ))
        )}
        <Text style={styles.footer}>
          <Text>CurePacket · documentation, not legal advice</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Remediation changelog</Text>
        {data.changelog.length === 0 ? (
          <Text>No changelog entries.</Text>
        ) : (
          data.changelog.map((entry) => (
            <View key={`${entry.at}-${entry.message}`} style={{ marginBottom: 8 }}>
              <Text style={styles.muted}>
                {entry.at} · {entry.author}
              </Text>
              <Text>{entry.message}</Text>
            </View>
          ))
        )}
        <View style={styles.rule} />
        <Text style={styles.sectionTitle}>Closing notice</Text>
        <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        <Text style={styles.footer}>
          <Text>CurePacket · documentation, not legal advice</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>
      </Page>
    </Document>
  );
}
