export default function handler(req, res) {
  console.log("Keepalive ping received");
  res.status(200).json({ status: "Bot is alive" });
}
