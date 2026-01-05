import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const payload = req.body?.payload;
    const message = payload?.body;
    const from = payload?.from;

    if (!message || !from) {
      return res.status(200).send("IGNORED");
    }

    const parts = message.trim().toUpperCase().split(/\s+/);
    let pdfUrl = null;

    // helper kirim text
    const sendText = async (text) => {
      await fetch(`${process.env.WAHA_URL}/api/send/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: from,
          text
        })
      });
    };

    // SO <KODE_TOKO>  → tanggal otomatis (last SO)
    if (parts.length === 2 && parts[0] === "SO") {
      const storeId = parts[1];
      const today = new Date()
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join("-");

      pdfUrl =
        `https://app.alfastore.co.id/prd/api/rpt/laporan_so/` +
        `csel_last_so_absolute_desc?storeId=${storeId}&dateSo=${today}`;
    }

    // SO <KODE_TOKO> <DD-MM-YYYY> → all SO
    else if (parts.length === 3 && parts[0] === "SO") {
      const storeId = parts[1];
      const dateSo = parts[2];

      pdfUrl =
        `https://app.alfastore.co.id/prd/api/rpt/laporan_so/` +
        `csel_all_so_absolute_desc?storeId=${storeId}&dateSo=${dateSo}`;
    }

    // format salah
    else {
      await sendText(
        "❌ Format salah\n\nGunakan:\nSO L787\natau\nSO L787 27-11-2025"
      );
      return res.status(200).send("WRONG FORMAT");
    }

    // kirim PDF
    await fetch(`${process.env.WAHA_URL}/api/send/document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: from,
        documentUrl: pdfUrl,
        fileName: "SO_Report.pdf"
      })
    });

    await sendText("✅ Laporan SO berhasil dikirim");
    return res.status(200).send("SENT");
  } catch (err) {
    console.error(err);
    return res.status(500).send("ERROR");
  }
}
