import axios from "axios";

const BOT_TOKEN = process.env.BOT_TOKEN;

const BASE_URL_ALL =
  "https://app.alfastore.co.id/prd/api/rpt/laporan_so/csel_all_so_absolute_desc";
const BASE_URL_LAST =
  "https://app.alfastore.co.id/prd/api/rpt/laporan_so/csel_last_so_absolute_desc";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const message = req.body.message;
  if (!message || !message.text) {
    return res.status(200).send("No message");
  }

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();

  // storeId: L123
  const storeMatch = text.match(/\b(l\d+)\b/);

  // tanggal: 09-11-2025 atau 09/11/2025
  const dateMatch = text.match(/\b(\d{2}[-/]\d{2}[-/]\d{4})\b/);

  if (!storeMatch || !dateMatch) {
    await sendMessage(
      chatId,
      "❌ Data tidak lengkap.\n\nContoh:\nL257 09/11/2025\nso all L123 01-12-2025"
    );
    return res.status(200).send("Invalid format");
  }

  const storeId = storeMatch[1].toUpperCase();
  const dateSo = dateMatch[1].replace(/\//g, "-");

  // default LAST
  const isAll = text.includes("all");

  const url = isAll
    ? `${BASE_URL_ALL}?storeId=${storeId}&dateSo=${dateSo}`
    : `${BASE_URL_LAST}?storeId=${storeId}&dateSo=${dateSo}`;

  const fileName = isAll
    ? `SO_ALL_${storeId}_${dateSo}.pdf`
    : `SO_LAST_${storeId}_${dateSo}.pdf`;

  try {
    const pdf = await axios.get(url, {
      responseType: "arraybuffer",
    });

    await sendDocument(chatId, pdf.data, fileName);
  } catch (err) {
    await sendMessage(chatId, "❌ Gagal mengambil file PDF.");
  }

  return res.status(200).send("OK");
}

// =======================
// Telegram helper
// =======================

async function sendMessage(chatId, text) {
  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text,
    }
  );
}

async function sendDocument(chatId, buffer, filename) {
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", new Blob([buffer]), filename);

  await axios.post(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
    formData,
    {
      headers: formData.getHeaders?.(),
    }
  );
}
