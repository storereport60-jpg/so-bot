import axios from "axios";
import FormData from "form-data";

const BOT_TOKEN = process.env.BOT_TOKEN;
const PDFSHIFT_KEY = process.env.PDFSHIFT_KEY;

/* ================= UTIL ================= */

function parseMessage(text) {
  const storeMatch = text.match(/L\d{3}/i);
  const dateMatch = text.match(/\d{2}[\/-]\d{2}[\/-]\d{4}/);
  const isAll = /all/i.test(text);

  if (!storeMatch) return null;

  const storeId = storeMatch[0].toUpperCase();
  const dateRaw = dateMatch ? dateMatch[0] : null;

  const date = dateRaw
    ? dateRaw.replace(/\//g, "-")
    : new Date().toISOString().slice(0, 10).split("-").reverse().join("-");

  return {
    storeId,
    date,
    type: isAll ? "all" : "last"
  };
}

function buildUrl({ storeId, date, type }) {
  return `https://app.alfastore.co.id/prd/api/rpt/laporan_so/csel_${type}_so_absolute_desc?storeId=${storeId}&dateSo=${date}`;
}

/* ============ HTML → PDF ============ */

async function convertToPdf(url) {
  const res = await axios.post(
    "https://api.pdfshift.io/v3/convert/pdf",
    {
      source: url,
      landscape: true,
      format: "A4",
      margin: "10mm"
    },
    {
      auth: {
        username: PDFSHIFT_KEY,
        password: ""
      },
      responseType: "arraybuffer"
    }
  );

  return res.data;
}

/* ============ TELEGRAM ============ */

async function sendMessage(chatId, text) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    { chat_id: chatId, text }
  );
}

async function sendPdf(chatId, buffer, filename) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", buffer, filename);

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
    form,
    { headers: form.getHeaders() }
  );
}

/* ============ HANDLER ============ */

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("OK");
    }

    const message = req.body.message;
    if (!message?.text) return res.status(200).end();

    const chatId = message.chat.id;
    const parsed = parseMessage(message.text);

    if (!parsed) {
      await sendMessage(
        chatId,
        "❌ Data tidak lengkap.\n\nContoh:\nL257 09/11/2025\nso all L123 01/12/2025"
      );
      return res.status(200).end();
    }

    const reportUrl = buildUrl(parsed);

    await sendMessage(chatId, "⏳ Mengambil laporan, mohon tunggu...");

    const pdfBuffer = await convertToPdf(reportUrl);

    const filename = `SO_${parsed.type.toUpperCase()}_${parsed.storeId}_${parsed.date}.pdf`;

    await sendPdf(chatId, pdfBuffer, filename);

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
}
