const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const sizeOf = require('image-size');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: process.argv[2] }),
  puppeteer: {
    headless: true,
  },
});

client.setMaxListeners(100000);

// Iniciar o QR CODE
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

// Vai informar se o login foi efetuado
client.on('ready', () => {
  console.log('Tudo certo! WhatsApp conectado.');
});

// E inicializa tudo para fazer a nossa mágica =)
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

// Variável para armazenar as informações dos usuários
const usuarios = {};

// Dimensões desejadas para a imagem
const frameWidth = 1080;
const frameHeight = 1920;

// Função para adicionar a moldura e texto à imagem
async function addFrameAndTextToImage(imagePath, framePath, text, outputPath, textX, textY) {
  // Carregar as dimensões da imagem
  const dimensions = sizeOf(imagePath);
  const originalWidth = dimensions.width;
  const originalHeight = dimensions.height;

  // Carregar as dimensões da moldura
  const frameDimensions = sizeOf(framePath);
  const frameWidth = frameDimensions.width;
  const frameHeight = frameDimensions.height;

  // Criar um novo canvas com as dimensões da moldura
  const canvas = createCanvas(frameWidth, frameHeight);
  const ctx = canvas.getContext('2d');

  // Preencher o canvas com a cor branca
  ctx.fillStyle = '#055E9B';
  ctx.fillRect(0, 0, frameWidth, frameHeight);

  // Calcular as novas dimensões para a imagem mantendo sua proporção
  let newWidth, newHeight;
  if (originalWidth / originalHeight >= frameWidth / frameHeight) {
    // Caso a imagem seja mais larga que a moldura, redimensionar pela largura
    newWidth = frameWidth;
    newHeight = (originalHeight * frameWidth) / originalWidth;
  } else {
    // Caso a imagem seja mais alta que a moldura, redimensionar pela altura
    newHeight = frameHeight;
    newWidth = (originalWidth * frameHeight) / originalHeight;
  }

  // Calcular as coordenadas para centralizar a imagem no canvas
  const x = (frameWidth - newWidth) / 2;
  const y = (frameHeight - newHeight) / 2;

  // Carregar e desenhar a imagem no canvas
  const image = await loadImage(imagePath);
  ctx.drawImage(image, x, y, newWidth, newHeight);

  // Carregar e desenhar a moldura no canvas
  const frame = await loadImage(framePath);
  ctx.drawImage(frame, 0, 0, frameWidth, frameHeight);

  // Adicionar o texto ao canvas
  ctx.font = 'bold 35px Arial';
  ctx.fillStyle = '#003B6F';
  ctx.textAlign = 'center';

  // Verificar se o texto excede o limite máximo de comprimento
  const maxTextWidth = 560; // Limite máximo de pixels para o comprimento do texto
  if (ctx.measureText(text).width > maxTextWidth) {
    // Caso exceda, ajustar quebras de linha horizontalmente
    const lines = addLineBreaks(ctx, text, maxTextWidth);
    text = lines.join('\n'); // Juntar as linhas com quebra de linha
  }

  // Verificar se o texto excede o limite máximo de altura
  const maxTextHeight = frameHeight - textY - 150; // Limite máximo de pixels para a altura do texto
  const textHeight = getTextHeight(ctx, text, maxTextWidth);
  if (textHeight > maxTextHeight) {
    // Caso exceda, ajustar quebras de linha verticalmente
    const lines = addLineBreaksVertical(ctx, text, maxTextWidth, maxTextHeight);
    text = lines.join('\n'); // Juntar as linhas com quebra de linha
  }

  ctx.fillText(text, textX, textY);

  // Salvar o canvas como uma imagem
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createJPEGStream({ quality: 0.95 });
  stream.pipe(out);
  out.on('finish', () => console.log('CAAP-Assist 🤖: Imagem com texto salva com sucesso!'));
}

// Função para dividir o texto em linhas com quebra automática horizontal
function addLineBreaks(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;

    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine.trim());
      currentLine = word;
    }
  }

  if (currentLine !== '') {
    lines.push(currentLine.trim());
  }

  return lines;
}

// Função para calcular a altura total do texto
function getTextHeight(ctx, text, maxWidth) {
  const words = text.split(' ');
  let currentLine = '';
  let totalHeight = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;

    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      totalHeight += 40; // Incrementar a altura por cada nova linha
      currentLine = word;
    }
  }

  totalHeight += 40; // Incrementar a altura para a última linha
  return totalHeight;
}

// Função para dividir o texto em linhas com quebra automática vertical
function addLineBreaksVertical(ctx, text, maxWidth, maxHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    const height = getTextHeight(ctx, currentLine + ' ' + word, maxWidth);

    if (width < maxWidth && height < maxHeight) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine.trim());
      currentLine = word;
    }
  }

  if (currentLine !== '') {
    lines.push(currentLine.trim());
  }

  return lines;
}

// Função para enviar o status de "GERANDO"
async function sendGeneratingStatus(chatId) {
  await client.sendMessage(chatId, '*CAAP-Assist 🤖:* \n\nGerando a imagem com a legenda... ⏳');
}

async function handleMessage(msg) {
  const chat = await msg.getChat();
  const phoneNumber = msg.from.replace('@c.us', '');

  try {
    if (msg.from.endsWith('@c.us')) {
      msg.react('❤');
      if (msg.hasMedia && msg.type === 'image') {
        const media = await msg.downloadMedia();
        const imageFilePath = `./${phoneNumber}_image.jpg`;
        fs.writeFileSync(imageFilePath, media.data, { encoding: 'base64' });

        if (msg.body) {
          const frameFilePath = 'moldura.png';
          const outputFilePath = `./${phoneNumber}_image_with_text.jpg`;
          const textToPlace = msg.body.slice(0, 102);

          if (msg.body.length > 102) {
            await client.sendMessage(
              msg.from,
              `*CAAP-Assist 🤖:* \n\nO texto excede o limite de 102 caracteres. Você digitou ${msg.body.length} caracteres. Por favor, envie novamente a imagem e o texto com a quantidade reduzida.`
            );
            return;
          }

          const textX = frameWidth / 2;
          const textY = 1690;

          await sendGeneratingStatus(msg.from);

          await addFrameAndTextToImage(imageFilePath, frameFilePath, textToPlace, outputFilePath, textX, textY);

          await delay(2000);

          const imageToSend = MessageMedia.fromFilePath(outputFilePath);
          await client.sendMessage(
            msg.from,
            imageToSend,
            { caption: '*CAAP-Assist 🤖:* \n\nAqui está sua imagem com a legenda!\n\n*Obrigado por utilizar o sistema DM-CAAP*' }
          );

          fs.unlinkSync(imageFilePath);
          fs.unlinkSync(outputFilePath);
        } else {
          await client.sendMessage(
            msg.from,
            '*CAAP-Assist 🤖:* \n\nPor favor, envie também uma legenda junto com a imagem.'
          );
        }
      } else {
        if (msg.hasMedia && msg.type === 'image' && msg.getMediaCount() > 1) {
          await client.sendMessage(
            msg.from,
            '*CAAP-Assist 🤖:* \n\nPor favor, envie apenas uma foto por vez junto com a legenda.'
          );
        } else {
          await client.sendMessage(
            msg.from,
            '*CAAP-Assist 🤖:* \n\nPor favor, envie uma imagem junto com a legenda.'
          );
        }
      }
    }
  } catch (error) {
    console.error('Erro ao processar a mensagem:', error);

    await client.sendMessage(
      msg.from,
      '*CAAP-Assist 🤖:* \n\nDesculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.'
    );
  }
}

client.on('message', async (msg) => {
  if (msg.from.endsWith('@c.us')) {
    const wid = msg.from.replace('@c.us', '');

    if (!usuarios[wid]) {
      usuarios[wid] = {};
    }

    usuarios[wid].ultimaMensagem = msg.body;
    usuarios[wid].ultimaData = new Date();

    await handleMessage(msg);
  }
});