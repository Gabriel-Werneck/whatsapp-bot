const express = require('express'); // Adicione o Express
const app = express();

const PORT = process.env.PORT || 3000; // Porta definida pelo Render ou padrão 3000

// Rota simples apenas para manter o serviço ativo
app.get('/', (req, res) => {
    res.send('WhatsApp Bot está rodando!');
});

// Inicia o servidor na porta configurada
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Restante do código do bot
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função para criar delay entre ações

// Objeto para armazenar o estado de cada usuário
const userStates = {};

// Funil principal do atendimento
client.on('message', async msg => {
    if (!msg.from.endsWith('@c.us')) return; // Ignora mensagens que não são de usuários

    const chat = await msg.getChat();
    const contact = await msg.getContact();
    const name = contact.pushname || "cliente";

    // Inicializa o estado do usuário, se necessário
    if (!userStates[msg.from]) {
        userStates[msg.from] = { hasProvidedInfo: false };
    }

    const userState = userStates[msg.from];

    // Caso o usuário não tenha fornecido informações, solicita novamente
    if (!userState.hasProvidedInfo) {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);

        await client.sendMessage(
            msg.from,
            `Olá, ${name.split(" ")[0]}! Sou a Letícia, do Aqui é Vendas. Representamos a Conamore, especialista em artigos de cama, mesa e banho de alta qualidade.

Para melhor atendê-lo(a), por gentileza, copie, preencha e envie as informações abaixo:

📋 Nome completo ou razão social:  
🆔 CPF ou CNPJ:  
📧 E-mail:  
🏠 Endereço de entrega (Rua, Nº, Bairro, Cidade e CEP):  
📞 Telefone de contato:  

Assim que recebermos suas informações, poderemos continuar o atendimento. Obrigada! 😊`
        );
        userState.awaitingInfo = true; // Define que o bot está aguardando as informações
        return;
    }

    // Verifica se as informações foram fornecidas
    if (userState.awaitingInfo) {
        const infoProvided = msg.body.match(/nome completo|razão social|cpf|cnpj|e-mail|endereço|telefone/i);
        if (infoProvided) {
            userState.hasProvidedInfo = true; // Marca que o usuário forneceu as informações
            userState.awaitingInfo = false;

            await client.sendMessage(
                msg.from,
                `Obrigada pelas informações! Agora, selecione uma das opções abaixo para continuar:

1️⃣ - Conhecer nosso institucional  
2️⃣ - Solicitar tabela de preços  
3️⃣ - Formas de pagamento  
4️⃣ - Outras perguntas`
            );
            return;
        } else {
            await client.sendMessage(
                msg.from,
                `As informações parecem incompletas. Por favor, copie, preencha e envie novamente as informações solicitadas.`
            );
            return;
        }
    }

    // Lógica para lidar com opções do menu
    const returnToMenu = async (chat) => {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(chat.id._serialized, `Posso ajudar com mais alguma coisa? Responda com:

✔️ Sim, para retornar ao menu principal.  
❌ Não, para encerrar o atendimento.`);
    };

    const affirmatives = /(sim|claro|ok|certo)/i;
    const negatives = /(não|nao)/i;

    if (affirmatives.test(msg.body)) {
        await client.sendMessage(msg.from, `Por favor, escolha uma das opções abaixo:

1️⃣ - Conhecer nosso catálogo  
2️⃣ - Solicitar tabela de preços  
3️⃣ - Formas de pagamento  
4️⃣ - Outras perguntas`);
        return;
    }

    if (negatives.test(msg.body)) {
        await client.sendMessage(msg.from, 'Obrigada pelo contato! Foi um prazer atender você. Qualquer outra necessidade, estamos à disposição. Tenha um ótimo dia! 😊');
        return;
    }

    // Outras opções
    switch (msg.body) {
        case '1':
            const catalog = MessageMedia.fromFilePath('./Conamore_2025.pdf');
            await client.sendMessage(msg.from, '📚 Aqui está nosso catálogo completo. Esperamos que goste dos nossos produtos!');
            await client.sendMessage(msg.from, catalog);
            break;
        case '2':
            const priceTable = MessageMedia.fromFilePath('./Catalogo_Hotelaria_2025.pdf');
            await client.sendMessage(msg.from, '📄 Segue a nossa tabela de preços atualizada. Qualquer dúvida, estou à disposição!');
            await client.sendMessage(msg.from, priceTable);
            break;
        case '3':
            await client.sendMessage(msg.from, `💳 As formas de pagamento são:

✔️ À vista (PIX/BOLETO/TED) - *DESCONTO DE 5%* a ser aplicado no orçamento caso seja a forma escolhida;  
✔️ Parcelado no cartão de crédito *sem juros*;  
✔️ Parcelado no cartão BNDES em até *32x*;  
✔️ Faturado no CNPJ mediante análise de crédito, com *50% à vista* e *50% para 30/60 dias*.  

Por favor, informe sua preferência!`);
            break;
        case '4':
            await client.sendMessage(msg.from, 'Se você tiver outras dúvidas ou quiser mais informações, é só perguntar por aqui! 😊');
            break;
        default:
            await client.sendMessage(msg.from, 'Desculpe, não entendi. Por favor, selecione uma opção válida do menu.');
    }
});
