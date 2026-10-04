export default async function handler(req, res) {
  // Configurar CORS básico por si fuera necesario
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { recipientEmail, subject, body, pdfHostedUrl, invoiceNumber } = req.body;
    
    // Obtenemos la API Key de las variables de entorno de Vercel
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'RESEND_API_KEY no está configurada en el servidor.' });
    }

    // Convertimos los saltos de línea del texto plano en <br> para HTML
    const formattedHtml = body.replace(/\n/g, '<br>');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Gestarian <onboarding@resend.dev>', // Correo por defecto de pruebas en Resend
        to: recipientEmail,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            ${formattedHtml}
          </div>
        `
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true, data });
    } else {
      res.status(500).json({ success: false, error: data.message || 'Error desconocido de Resend' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
