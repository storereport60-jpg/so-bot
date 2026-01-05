import fetch from "node-fetch";

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const { message, sender } = req.body;
    if (!message || !sender) return res.status(200).send("No data");

    const parts = message.trim().split(/\s+/);

    let pdfUrl = null;

    // so + kode toko
    if (parts.length === 2 && parts[0].toLowerCase() === "so") {
      const storeId = parts[1];
      const today = formatDate(new Date());
      pdfUrl = `https://app.alfastore.co.id/prd/api/rpt/laporan_so/csel_last_so_absolute_desc?storeId=${storeId}&dateSo=${today}`;
    }

    // so + kode toko + tanggal
    if (parts.length === 3 && parts[0].toLowerCase() === "so") {
      const storeId = parts[1];
      const dateSo = parts[2];
      pdfUrl = `https://app.alfastore.co.id/prd/api/rpt/laporan_so/csel_all_so_absolute_desc?storeId=${storeId}&dateSo=${dateSo}`;
    }

    if (!pdfUrl) {
      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: process.env.FONTE_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: sender,
          message: "Format salah\nGunakan:\nSO L787\natau\nSO L787 27-11-2025",
        }),
      });
      return res.status(200).send("Invalid format");
    }

    await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONTE_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: sender,
        file: pdfUrl,
        filename: "laporan_so.pdf",
      }),
    });

    return res.status(200).send("Sent");
  } catch (e) {
    console.error(e);
    return res.status(500).send("Error");
  }
}
