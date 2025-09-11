import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// --- LÓGICA DO GERADOR DE JOGOS (não mudou) ---
function generateSingleGame() {
    const mostFrequentNumbers = [20, 10, 25, 11, 24, 13, 14, 4, 3, 2, 12, 1, 19, 5, 22, 18, 9, 15];
    const pool = [];
    for (let i = 1; i <= 25; i++) { pool.push(i); }
    mostFrequentNumbers.forEach(num => {
        for (let i = 0; i < 4; i++) { pool.push(num); }
    });
    
    const selectedNumbers = new Set();
    while (selectedNumbers.size < 15) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        selectedNumbers.add(pool[randomIndex]);
    }
    return Array.from(selectedNumbers).sort((a, b) => a - b);
}

export default async function handler(request, response) {
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }
    
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { paymentId } = request.body;
    if (!paymentId) {
        return response.status(400).json({ error: 'ID do pagamento não fornecido.' });
    }

    try {
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });
        
        const expectedAmount = 1.00; // Valor de teste

        if (paymentInfo.status === 'approved' && paymentInfo.transaction_amount === expectedAmount) {
            // Pagamento aprovado, agora vamos ver o tipo de plano
            const planType = paymentInfo.metadata.plan_type;

            if (planType === 'single') {
                // Se for jogada única, gera os jogos e envia
                const games = Array.from({ length: 5 }, () => generateSingleGame());
                response.status(200).json({ games: games });
            } else if (planType === 'monthly') {
                // Se for acesso mensal, apenas confirma a assinatura. O frontend vai salvar o acesso.
                response.status(200).json({ 
                    subscription: true, 
                    email: paymentInfo.payer.email 
                });
            } else {
                response.status(400).json({ error: 'Tipo de plano desconhecido.' });
            }

        } else {
            // Pagamento ainda não confirmado ou valor incorreto
            response.status(402).json({ error: 'Pagamento não confirmado ou valor incorreto.' });
        }
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        response.status(500).json({ error: 'Falha ao verificar o status do pagamento.' });
    }
}
