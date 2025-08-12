import { MercadoPagoConfig, Payment } from 'mercadopago';

// A chave secreta será lida das Environment Variables da Vercel
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

// --- LÓGICA DO GERADOR DE JOGOS ---
function generateSingleGame() {
    const mostFrequentNumbers = [10, 53, 5, 42, 37, 33, 23, 34, 4, 24, 41, 17, 30, 51, 54];
    const pool = [];
    for (let i = 1; i <= 60; i++) { pool.push(i); }
    mostFrequentNumbers.forEach(num => {
        for (let i = 0; i < 4; i++) { pool.push(num); }
    });
    
    const selectedNumbers = new Set();
    while (selectedNumbers.size < 6) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        selectedNumbers.add(pool[randomIndex]);
    }
    return Array.from(selectedNumbers).sort((a, b) => a - b);
}


export default async function handler(request, response) {
    // Tratamento para requisições OPTIONS do CORS
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
        
        // Validação crucial: Checa se o pagamento está 'approved' e se o valor está correto
        if (paymentInfo.status === 'approved' && paymentInfo.transaction_amount === 3.00) {
            const games = Array.from({ length: 5 }, () => generateSingleGame());
            response.status(200).json({ games });
        } else {
            response.status(402).json({ error: 'Pagamento não confirmado ou valor incorreto.' });
        }
    } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        response.status(500).json({ error: 'Falha ao verificar o pagamento.' });
    }
}
