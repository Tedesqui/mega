import { createClient } from "@vercel/kv";

// A inicialização do cliente KV foi movida para dentro da função handler.

export default async function handler(request, response) {
    // --- Verificação de Sanidade das Variáveis de Ambiente ---
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.error('ERRO CRÍTICO: As variáveis de ambiente da base de dados (KV) não foram encontradas.');
        return response.status(500).json({ error: 'Erro de configuração interna do servidor. A ligação com a base de dados falhou.' });
    }

    // Inicializa o cliente KV aqui, dentro da função, para garantir que as variáveis de ambiente existem.
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
        
        if (!accessPass || !accessPass.expiresAt) {
            // Se não houver passe de acesso, informa que não tem acesso
            return response.status(200).json({ hasAccess: false });
        }

        const expiryDate = new Date(accessPass.expiresAt);
        const now = new Date();

        if (expiryDate > now) {
            // Se o passe for válido, calcula os dias restantes e informa que tem acesso
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return response.status(200).json({ hasAccess: true, daysLeft: diffDays });
        } else {
            // Se o passe estiver expirado, informa que não tem acesso
            return response.status(200).json({ hasAccess: false });
        }

    } catch (error) {
        console.error('Erro ao verificar acesso no KV:', error);
        return response.status(500).json({ error: 'Falha ao consultar o acesso.' });
    }
}

