import { createClient } from "@vercel/kv";

// Inicializa o cliente KV para comunicar com a base de dados Upstash
const kv = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

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
        
        if (!accessPass || !accessPass.expiresAt) {
            return response.status(200).json({ hasAccess: false });
        }

        const expiryDate = new Date(accessPass.expiresAt);
        const now = new Date();

        if (expiryDate > now) {
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return response.status(200).json({ hasAccess: true, daysLeft: diffDays });
        } else {
            return response.status(200).json({ hasAccess: false });
        }

    } catch (error) {
        console.error('Erro ao verificar acesso no KV:', error);
        return response.status(500).json({ error: 'Falha ao consultar o acesso.' });
    }
}

