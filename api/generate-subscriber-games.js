import { createClient } from "@vercel/kv";

// A inicialização do cliente KV foi movida para dentro da função handler.

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
    // <-- ALTERAÇÃO: A verificar as variáveis corretas (KV_* em vez de UPSTASH_*)
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.error('ERRO CRÍTICO: As variáveis de ambiente da base de dados (KV) não foram encontradas.');
        return response.status(500).json({ error: 'Erro de configuração interna do servidor. A ligação com a base de dados falhou.' });
    }

    // Inicializa o cliente KV aqui, dentro da função, para garantir que as variáveis de ambiente existem.
    // <-- ALTERAÇÃO: A usar as variáveis corretas (KV_* em vez de UPSTASH_*)
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método Não Permitido' });
    }
    
    const { email } = request.body;
    if (!email) {
        return response.status(400).json({ error: 'O e-mail é obrigatório.' });
    }

    try {
        const accessPass = await kv.get(email.toLowerCase());
        const now = new Date();

        if (accessPass && new Date(accessPass.expiresAt) > now) {
            const games = generateGamesLogic();
            return response.status(200).json({ games });
        } else {
            return response.status(403).json({ error: 'Acesso negado. O seu acesso pode ter expirado.' });
        }
    } catch (error) {
        console.error('Erro ao gerar jogos de assinante:', error);
        return response.status(500).json({ error: 'Falha ao gerar jogos.' });
    }
}

