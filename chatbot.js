const express = require('express'); // Adicionando o Express
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fetch = require('node-fetch'); // Para manter o serviço ativo com requisições

const app = express();
const PORT = process.env.PORT || 3000; // Porta usada pelo Render ou padrão 3000

// Rota básica para manter o serviço ativo
app.get('/', (req, res) => {
    res.send('Bot WhatsApp está rodando!');
});

// Inicia o servidor Express
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Configuração do bot WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: '/tmp/.wwebjs_auth', // Usar a pasta temporária do sistema
    }),
});

client.on('qr', (qr) => {
    console.log('QR Code recebido. Escaneie para conectar.');
    const qrcode = require('qrcode-terminal');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot conectado com sucesso!');
});

// Lidar com falha de autenticação
client.on('auth_failure', () => {
    console.error('Falha na autenticação.');
});

// Lidar com desconexão
client.on('disconnected', (reason) => {
    console.log('Desconectado:', reason);
    console.log('Tentando reconectar...');
    client.initialize();
});

// Inicializa o bot
client.initialize();

// Função para enviar requisições periódicas para manter o serviço ativo
setInterval(() => {
    console.log("Mantendo o serviço ativo...");
    fetch('https://whatsapp-bot-3vwc.onrender.com') // URL do seu bot no Render
        .then(response => {
            if (response.ok) {
                console.log("Serviço ativo");
            } else {
                console.log("Erro ao manter o serviço ativo");
            }
        })
        .catch(error => {
            console.error("Erro na requisição para manter o serviço ativo:", error);
        });
}, 5 * 60 * 1000); // Intervalo de 5 minutos

// Função para criar delay entre ações
const delay = ms => new Promise(res => setTimeout(res, ms));

// Funil principal do atendimento
client.on('message', async msg => {
    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola|teste|Teste)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        const contact = await msg.getContact();
        const name = contact.pushname || "cliente"; 

        await client.sendMessage(msg.from, `Olá, ${name.split(" ")[0]}! Sou a Letícia, do Aqui é Vendas. Representamos a Conamore, especialista em artigos de cama, mesa e banho de alta qualidade. Para melhor atendê-lo(a), por gentileza, peço que me informe os seguintes dados para emissão do cadastro e orçamento:

📋 Nome completo ou razão social:
🆔 CPF ou CNPJ:
📧 E-mail:
🏠 Endereço de entrega (Rua, Nº, Bairro, Cidade e CEP):
📞 Telefones de contato:

Assim que recebermos suas informações, poderemos continuar o atendimento. Obrigada! 😊`);
        return;
    }

    // Verificar se o cliente já forneceu as informações solicitadas
    const infoProvided = msg.body.match(/(nome completo|razão social|cpf|cnpj|e-mail|endereço|telefone|@)/i);

    if (infoProvided) {
        await client.sendMessage(msg.from, `Obrigada pelas informações! Agora, selecione uma das opções abaixo para continuar:

1️⃣ - Conhecer nosso catálogo
2️⃣ - Solicitar tabela de preços
3️⃣ - Formas de pagamento
4️⃣ - Outras perguntas`);
        return;
    }

    const returnToMenu = async (chat) => {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(chat.id._serialized, `Posso ajudar com mais alguma coisa? Responda com:

✔️ Sim, para retornar ao menu principal.
❌ Não, para encerrar o atendimento.`);
    };

    // Enviar catálogo
    if (msg.body === '1' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        const catalog = MessageMedia.fromFilePath('./Catalogo_Hotelaria_2025.pdf'); // Certifique-se de ter o arquivo "catalogo.pdf" no diretório

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, '📚 Aqui está nosso catálogo completo. Esperamos que goste dos nossos produtos!');
        await client.sendMessage(msg.from, catalog);
        await returnToMenu(chat);
        return;
    }

    // Enviar tabela de preços
    if (msg.body === '2' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        const priceTable = MessageMedia.fromFilePath('./Conamore_2025.pdf'); // Certifique-se de ter o arquivo "tabela_precos.pdf" no diretório

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, '📄 Segue o nosso material institucional. Qualquer dúvida, estou à disposição!');
        await client.sendMessage(msg.from, priceTable);
        await returnToMenu(chat);
        return;
    }

    // Formas de pagamento
    if (msg.body === '3' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, `💳 As formas de pagamento são:

✔️ À vista (PIX/BOLETO/TED) - *DESCONTO DE 5%* a ser aplicado no orçamento caso seja a forma escolhida;  
✔️ Parcelado no cartão de crédito *sem juros*;  
✔️ Parcelado no cartão BNDES em até *32x*;  
✔️ Faturado no CNPJ mediante análise de crédito, com *50% à vista* e *50% para 30/60 dias*.  

Por favor, informe sua preferência!`);
        await returnToMenu(chat);
        return;
    }

    // Outras perguntas
    if (msg.body === '4' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(msg.from, 'Se você tiver outras dúvidas ou quiser mais informações, é só perguntar por aqui! 😊');
        await returnToMenu(chat);
        return;
    }

    // Resposta ao menu de retorno
    if (msg.body.match(/^(sim|Sim|s|S|si|Si)$/i) && msg.from.endsWith('@c.us')) {
        await client.sendMessage(msg.from, `Por favor, escolha uma das opções abaixo:

1️⃣ - Conhecer nosso catálogo
2️⃣ - Saber mais sobre nós
3️⃣ - Formas de pagamento
4️⃣ - Outras perguntas`);
    } else if (msg.body.match(/^(não|Não|nao|Nao|na|Na|N|n)$/i) && msg.from.endsWith('@c.us')) {
        await client.sendMessage(msg.from, 'Obrigada pelo contato! Foi um prazer atender você. Qualquer outra necessidade, estamos à disposição. Tenha um ótimo dia! 😊');
    }
});
