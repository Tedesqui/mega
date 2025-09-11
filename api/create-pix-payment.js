import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método Não Permitido' });
    }

    const { email, description, planType } = request.body;
    if (!email || !description || !planType) {
        return response.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const payment_data = {
        transaction_amount: 1.00, // Valor fixo de 1.00 para testes
        description: description,
        payment_method_id: 'pix',
        payer: { email: email },
        date_of_expiration: expirationDate,
        metadata: {
            plan_type: planType,
            user_email: email.toLowerCase()
        }
    };

    try {
        const payment = new Payment(client);
        const result = await payment.create({ body: payment_data });
        response.status(201).json({
            paymentId: result.id,
            qrCode: result.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
        });
    } catch (error) {
        console.error('Erro ao criar pagamento PIX:', error.cause || error);
        response.status(500).json({ error: 'Falha ao gerar o pagamento PIX.' });
    }
}
