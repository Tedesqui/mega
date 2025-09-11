import { createClient } from "@vercel/kv";

// Inicializa o cliente KV para comunicar com a base de dados Upstash
const kv = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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

