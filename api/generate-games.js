import { createClient } from "@vercel/kv";
import { MercadoPagoConfig, Payment } from 'mercadopago';

const plans = {
    single: { amount: 1.00 }, // Valor de teste
    monthly: { amount: 1.00 } // Valor de teste
};

// A inicialização do cliente Mercado Pago pode permanecer aqui
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN });

function generateGamesLogic() {
    const mostFrequentNumbers = [20, 10, 25, 11, 24, 13, 14, 4, 3, 2, 12, 1, 19, 5, 22, 18, 9, 15];
    return Array.from({ length: 5 }, () => {
        const pool = Array.from({ length: 25 }, (_, i) => i + 1);
        mostFrequentNumbers.forEach(num => { for (let i = 0; i < 4; i++) pool.push(num); });
        const selectedNumbers = new Set();
        while (selectedNumbers.size < 15) {
            selectedNumbers.add(pool[Math.floor(Math.random() * pool.length)]);
        }
        return Array.from(selectedNumbers).sort((a, b) => a - b);
    });
}

export default async function handler(request, response) {
    // --- Verificação de Sanidade das Variáveis de Ambiente ---
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.error('ERRO CRÍTICO: As variáveis de ambiente da base de dados (KV) não foram encontradas.');
        return response.status(500).json({ error: 'Erro de configuração interna do servidor. A ligação com a base de dados falhou.' });
    }

    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
        console.error('ERRO CRÍTICO: A variável de ambiente do Mercado Pago não foi encontrada.');
        return response.status(500).json({ error: 'Erro de configuração interna do servidor. A integração de pagamentos falhou.' });
    }

    // Inicializa o cliente KV aqui, dentro da função, para garantir que as variáveis de ambiente existem.
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método Não Permitido' });
    }
    
    const { paymentId } = request.body;
    if (!paymentId) {
        return response.status(400).json({ error: 'ID do pagamento não fornecido.' });
    }

    try {
        const payment = new Payment(client);
        const paymentInfo = await payment.get({ id: paymentId });
        
        // Se o pagamento ainda não foi aprovado, informa o frontend para continuar a verificar
        if (paymentInfo.status !== 'approved') {
            return response.status(402).json({ message: 'Pagamento pendente.' });
        }
        
        const planType = paymentInfo.metadata?.plan_type;
        const userEmail = paymentInfo.payer?.email?.toLowerCase();

        if (!planType || !plans[planType] || !userEmail) {
            return response.status(400).json({ error: 'Dados do pagamento inválidos ou em falta.' });
        }

        // Verifica se o valor pago corresponde ao valor esperado para o plano
        if (paymentInfo.transaction_amount < plans[planType].amount) {
             return response.status(400).json({ error: 'O valor pago é menor que o valor do plano.' });
        }

        // Se o plano for mensal, guarda o passe de acesso na base de dados
        if (planType === 'monthly') {
            const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const accessPass = { expiresAt: expiryDate.toISOString() };
            await kv.set(userEmail, accessPass);
            return response.status(200).json({ subscription: true, email: userEmail });
        }
        
        // Se o plano for de jogada única, gera os jogos e envia-os
        if (planType === 'single') {
            return response.status(200).json({ games: generateGamesLogic(), email: userEmail });
        }

    } catch (error) {
        console.error('Erro detalhado ao verificar pagamento:', error.cause || error);
        return response.status(500).json({ error: 'Falha ao verificar o estado do pagamento.' });
    }
}

