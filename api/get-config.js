export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Método Não Permitido' });
    }

    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;

    if (!publicKey) {
        console.error("A chave pública do Mercado Pago não foi configurada nas variáveis de ambiente.");
        return response.status(500).json({ error: 'Erro de configuração interna do servidor.' });
    }

    response.status(200).json({ publicKey: publicKey });
}
