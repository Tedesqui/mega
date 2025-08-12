import { MercadoPagoConfig, Payment } from 'mercadopago';

// Inicializa o cliente com a sua chave secreta
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = request.body;

    if (!email) {
        return response.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    // --- ALTERAÇÃO APLICADA AQUI ---
    // Calcula a data de expiração para 1 hora a partir de agora
    const expirationDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    const payment_data = {
        transaction_amount: 3.00,
        description: '5 Jogos Inteligentes da Mega-Sena',
        payment_method_id: 'pix',
        payer: {
            email: email,
        },
        date_of_expiration: expirationDate,
    };

    try {
        const payment = new Payment(client);
        const result = await payment.create({ body: payment_data });

        // Envia de volta os dados essenciais para o frontend
        response.status(201).json({
            paymentId: result.id,
            qrCode: result.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
        });

    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error);
        response.status(500).json({ error: 'Falha ao gerar o pagamento PIX.' });
    }
}
