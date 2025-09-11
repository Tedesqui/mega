import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(request, response) {
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, amount, description, planType } = request.body;

    if (!email || !amount || !description || !planType) {
        return response.status(400).json({ error: 'Campos obrigatórios ausentes: email, amount, description, planType.' });
    }

    if (parseFloat(amount) !== 3.00 && parseFloat(amount) !== 29.90) {
        return response.status(400).json({ error: 'Valor de transação inválido.' });
    }

    const expirationDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    const payment_data = {
        transaction_amount: Number(amount),
        description: description,
        payment_method_id: 'pix',
        payer: {
            email: email,
        },
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
