async function dispatchNotification(notification) {
  const url = notification.canal === 'whatsapp' ? process.env.WHATSAPP_WEBHOOK_URL : process.env.EMAIL_WEBHOOK_URL;
  if (!url) return { status: 'simulado', detalhe: 'Sem webhook configurado; envio registrado localmente.' };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification)
  });
  if (!response.ok) throw new Error(`Webhook respondeu ${response.status}`);
  return { status: 'enviado', detalhe: 'Webhook acionado com sucesso.' };
}
module.exports = { dispatchNotification };
