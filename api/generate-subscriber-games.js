import { kv } from '@vercel/kv';

// Reutilizamos a mesma lógica de geração de jogos
const generateFiveGames = () => {
    const mostFrequentNumbers = [20, 10, 25, 11, 24, 13, 14, 4, 3, 2, 12, 1, 19, 5, 22, 18, 9, 15];
    const pool = Array.from({ length: 25 }, (_, i) => i + 1);
    mostFrequentNumbers.forEach(num => {
        for (let i = 0; i < 4; i++) { pool.push(num); }
    });
    
    const games = [];
    for (let i = 0; i < 5; i++) {
        const selectedNumbers = new Set();
        while (selectedNumbers.size < 15) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            selectedNumbers.add(pool[randomIndex]);
        }
        games.push(Array.from(selectedNumbers).sort((a, b) => a - b));
    }
    return games;
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = request.body;
    if (!email) {
        return response.status(400).json({ error: 'Email é obrigatório para gerar jogos.' });
    }

    try {
        const subscription = await kv.get(email.toLowerCase());
        if (subscription && subscription.active && new Date(subscription.expiresAt) > new Date()) {
            const games = generateFiveGames();
            return response.status(200).json({ games });
        } else {
            return response.status(403).json({ error: 'Assinatura não encontrada ou expirada.' });
        }
    } catch (error) {
        console.error('Erro ao gerar jogos de assinante:', error);
        return response.status(500).json({ error: 'Falha ao gerar jogos.' });
    }
}
