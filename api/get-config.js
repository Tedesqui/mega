export default async function handler(request, response) {
    // Tratamento para requisições OPTIONS do CORS
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    // Pega a Public Key das variáveis de ambiente da Vercel
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

    if (!publicKey) {
        return response.status(500).json({ error: 'Chave pública não configurada no servidor.' });
    }

    // Envia a chave como resposta
    response.status(200).json({
        publicKey: publicKey,
    });
}