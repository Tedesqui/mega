import { MercadoPagoConfig, Payment } from 'mercadopago';

// Inicializa o cliente do Mercado Pago com a sua chave de acesso
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(request, response) {
    // Permite que o frontend (em outro domínio, se for o caso) se comunique com esta API
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    // Aceita apenas requisições do tipo POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, amount, description, planType } = request.body;

    // Validação dos campos recebidos do frontend
    if (!email || !amount || !description || !planType) {
        return response.status(400).json({ error: 'Campos obrigatórios ausentes: email, amount, description, planType.' });
    }

    // Define a data de expiração do PIX para 30 minutos a partir de agora
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

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

        // Se o pagamento for criado com sucesso, retorna os dados para o frontend
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
