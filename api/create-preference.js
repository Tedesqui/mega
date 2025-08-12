import { MercadoPagoConfig, Preference } from 'mercadopago';

// A chave secreta será lida das Environment Variables da Vercel
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(request, response) {
    // Tratamento para requisições OPTIONS do CORS
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    // IMPORTANTE: ATUALIZE COM A URL REAL DO SEU SITE NO GITHUB PAGES
    const frontendUrl = 'https://SEU-USUARIO.github.io/SEU-REPO-FRONTEND/';

    try {
        // Calcula a data de expiração para 30 minutos a partir de agora
        const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'jogos-mega-sena-01',
                        title: '5 Jogos Inteligentes da Mega-Sena',
                        quantity: 1,
                        unit_price: 3.00,
                        currency_id: 'BRL',
                    },
                ],
                back_urls: {
                    success: frontendUrl,
                    failure: frontendUrl,
                    pending: frontendUrl,
                },
                auto_return: 'approved',
                // Adiciona a data de expiração na preferência (bom para PIX e Boleto)
                date_of_expiration: expirationDate,
            },
        });

        response.status(200).json({ preferenceId: result.id });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        response.status(500).json({ error: 'Falha ao criar preferência de pagamento.' });
    }
}
