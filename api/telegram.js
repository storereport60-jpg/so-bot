export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram Bot OK");
  }

  const body = req.body;
  const chatId = body.message?.chat.id;
  const text = body.message?.text;

  if (!chatId) {
    return res.status(200).end();
  }

  let reply = "Halo 👋";

  if (text === "/start") {
    reply = "Bot aktif ✅\nKirim pesan apa saja.";
  } else {
    reply = `Kamu kirim: ${text}`;
  }

  await fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    }
  );

  res.status(200).end();
}
