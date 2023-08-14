const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const sizeOf = require('image-size');

const { getAsciiArt } = require('./asciiArt'); // Substitua pelo caminho correto

const asciiArt = getAsciiArt();

console.log(asciiArt);

const client = new Client({
  authStrategy: new LocalAuth({ clientId: process.argv[2] }),
  puppeteer: {
    headless: true,
  },
});

client.setMaxListeners(100000);

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

const usuarios = {};

const frameWidth = 1080;
const frameHeight = 1920;

const molduras = [
  { name: 'moldura1', path: 'img/moldura1.png', textConfig: { textX: frameWidth / 2, textY: 1690 }, textColor: '#000000', font: 'bold 35px Arial', maxTextCharacters: 100 },
  { name: 'moldura2', path: 'img/moldura2.png', textConfig: { textX: frameWidth / 2, textY: 1620 }, textColor: '#DF2625', font: 'bold 35px Verdana', maxTextCharacters: 120 },
  { name: 'moldura3', path: 'img/moldura3.png', textConfig: { textX: frameWidth / 2, textY: 1545 }, textColor: '#003B6F', font: 'bold 35px Trebuchet MS', maxTextCharacters: 120 },
  // ...
  // Mantenha as demais molduras aqui
  // ...
];

function addLineBreaks(ctx, text, maxWidth, maxTextCharacters) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  let currentCharacters = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    const wordCharacters = word.length + 1;
    if (currentCharacters + wordCharacters <= maxTextCharacters && width < maxWidth) {
      currentLine += ' ' + word;
      currentCharacters += wordCharacters;
    } else {
      lines.push(currentLine.trim());
      currentLine = word;
      currentCharacters = wordCharacters;
    }
  }

  if (currentLine !== '') {
    lines.push(currentLine.trim());
  }

  return lines;
}

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
      totalHeight += 40;
      currentLine = word;
    }
  }
  totalHeight += 40;
  return totalHeight;
}

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

function sendGeneratingStatus(chatId) {
  return client.sendMessage(chatId, '*CAAP-Assist 🤖:* \n\nGerando a imagem com a legenda... ⏳');
}

function showMoldurasOptions(chatId) {
  let moldurasList = '*CAAP-Assist 🤖:* \n\nEscolha uma das molduras disponíveis:\n\n';
  molduras.forEach((moldura, index) => {
    moldurasList += `${index + 1}. ${moldura.name}\n`;
  });

  const imagePath = 'exemplo.png';
  const media = MessageMedia.fromFilePath(imagePath);
  return client.sendMessage(chatId, media, { caption: moldurasList });
}

async function addFrameAndTextToImage(imagePath, framePath, text, outputPath, textX, textY, textColor, font, maxTextCharacters) {
  const dimensions = sizeOf(imagePath);
  const originalWidth = dimensions.width;
  const originalHeight = dimensions.height;
  const frameDimensions = sizeOf(framePath);
  const frameWidth = frameDimensions.width;
  const frameHeight = frameDimensions.height;
  const canvas = createCanvas(frameWidth, frameHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#055E9B';
  ctx.fillRect(0, 0, frameWidth, frameHeight);
  let newWidth, newHeight;
  if (originalWidth / originalHeight >= frameWidth / frameHeight) {
    newWidth = frameWidth;
    newHeight = (originalHeight * frameWidth) / originalWidth;
  } else {
    newHeight = frameHeight;
    newWidth = (originalWidth * frameHeight) / originalHeight;
  }
  const x = (frameWidth - newWidth) / 2;
  const y = (frameHeight - newHeight) / 2;
  const image = await loadImage(imagePath);
  ctx.drawImage(image, x, y, newWidth, newHeight);
  const frame = await loadImage(framePath);
  ctx.drawImage(frame, 0, 0, frameWidth, frameHeight);
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = 'center';
  const maxTextWidth = 560;
  if (ctx.measureText(text).width > maxTextWidth) {
    const lines = addLineBreaks(ctx, text, maxTextWidth, maxTextCharacters);
    text = lines.join('\n');
  }
  const maxTextHeight = frameHeight - textY - 150;
  const textHeight = getTextHeight(ctx, text, maxTextWidth);
  if (textHeight > maxTextHeight) {
    const lines = addLineBreaksVertical(ctx, text, maxTextWidth, maxTextHeight);
    text = lines.join('\n');
  }
  ctx.fillText(text, textX, textY);
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createJPEGStream({ quality: 0.95 });
  stream.pipe(out);
  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log('CAAP-Assist 🤖: Imagem com texto salva com sucesso!');
      resolve();
    });
    out.on('error', reject);
  });
}

client.on('message', async (message) => {
  const phoneNumber = message.from.replace('@c.us', '');

  if (!usuarios[phoneNumber]) {
    usuarios[phoneNumber] = {};
  }

  try {
    if (message.body === '!moldura') {
      message.react('🟢');
      await showMoldurasOptions(message.from);
      usuarios[phoneNumber].awaitingMoldura = true;
    } else if (message.body.startsWith('!') && usuarios[phoneNumber]?.awaitingMoldura) {
      const molduraName = message.body.slice(1);
      const selectedMoldura = molduras.find(moldura => moldura.name === molduraName);
      if (selectedMoldura) {
        usuarios[phoneNumber].selectedMoldura = selectedMoldura;
        await client.sendMessage(message.from, '*CAAP-Assist 🤖:* \n\nAgora envie a imagem junto com a legenda.');
        message.react('🟢');
        usuarios[phoneNumber].awaitingMoldura = false;
        usuarios[phoneNumber].awaitingImage = true;
      } else {
        await client.sendMessage(message.from, '*CAAP-Assist 🤖:* \n\nMoldura inválida. \nPor favor, escolha uma das molduras disponíveis.');
        message.react('🔴');
      }
    } else if (message.hasMedia && message.type === 'image' && usuarios[phoneNumber]?.awaitingImage) {
      const media = await message.downloadMedia();
      const imageFilePath = `./${phoneNumber}_image.jpg`;
      fs.writeFileSync(imageFilePath, media.data, { encoding: 'base64' });

      if (message.body) {
        const frameFilePath = usuarios[phoneNumber].selectedMoldura.path;
        const outputFilePath = `./${phoneNumber}_image_with_text.jpg`;
        const textToPlace = message.body.slice(0, usuarios[phoneNumber].selectedMoldura.maxTextCharacters);

        if (message.body.length > usuarios[phoneNumber].selectedMoldura.maxTextCharacters) {
          await client.sendMessage(
            message.from,
            '*CAAP-Assist 🤖:* \n\nO texto excede o limite de caracteres. Por favor, envie novamente a imagem e o texto com a quantidade reduzida.'
          );
          message.react('🔴');
          return;
        }

        const textX = usuarios[phoneNumber].selectedMoldura.textConfig.textX;
        const textY = usuarios[phoneNumber].selectedMoldura.textConfig.textY;
        const textColor = usuarios[phoneNumber].selectedMoldura.textColor;
        const font = usuarios[phoneNumber].selectedMoldura.font;

        await sendGeneratingStatus(message.from);

        await addFrameAndTextToImage(imageFilePath, frameFilePath, textToPlace, outputFilePath, textX, textY, textColor, font, usuarios[phoneNumber].selectedMoldura.maxTextCharacters);

        await delay(2000);

        const imageToSend = MessageMedia.fromFilePath(outputFilePath);
        await client.sendMessage(
          message.from,
          imageToSend,
          { caption: '*CAAP-Assist 🤖:* \n\nAqui está sua imagem com a legenda!\n\n*Obrigado por utilizar o sistema DM-CAAP*' }
        );

        fs.unlinkSync(imageFilePath);
        fs.unlinkSync(outputFilePath);
      } else {
        await client.sendMessage(
          message.from,
          '*CAAP-Assist 🤖:* \n\nPor favor, envie também uma legenda junto com a imagem.'
        );
        message.react('🟡');
      }
      usuarios[phoneNumber].awaitingImage = false;
    }
  } catch (error) {
    console.error('Erro ao processar a mensagem:', error);
    await client.sendMessage(
      message.from,
      '*CAAP-Assist 🤖:* \n\nDesculpe, ocorreu um erro ao processar sua mensagem. \nPor favor, tente novamente mais tarde.'
    );
  }
});
