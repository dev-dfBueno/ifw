# CAAP-Assist 🤖

Este é um script Node.js que utiliza a biblioteca `whatsapp-web.js` para interagir com o WhatsApp e realizar as seguintes tarefas:

1. Gerar e exibir um Código QR para autenticação do cliente do WhatsApp.
2. Fornecer feedback quando o cliente do WhatsApp estiver pronto e conectado.
3. Lidar com mensagens recebidas, especialmente imagens, processando-as para adicionar uma moldura e texto antes de enviá-las de volta.

## Dependências

Antes de executar o script, você precisa instalar as dependências necessárias:

1. [`qrcode-terminal`](https://www.npmjs.com/package/qrcode-terminal): Usado para exibir o Código QR para autenticação do WhatsApp.
2. [`whatsapp-web.js`](https://www.npmjs.com/package/whatsapp-web.js): A biblioteca cliente do WhatsApp.
3. [`canvas`](https://www.npmjs.com/package/canvas): Para processamento de imagens, adição de molduras e texto em imagens.
4. [`fs`](https://nodejs.org/api/fs.html): O módulo de sistema de arquivos integrado do Node.js para leitura e gravação de arquivos.
5. [`image-size`](https://www.npmjs.com/package/image-size): Para obter as dimensões das imagens.

Você pode instalar essas dependências usando o seguinte comando:

```bash
npm install qrcode-terminal whatsapp-web.js canvas fs image-size
```

## Como usar

1. Certifique-se de ter o Node.js instalado em sua máquina.
2. Clone ou baixe este script para o seu computador local.
3. Navegue até o diretório do script no terminal.
4. Execute o script usando o seguinte comando:

```bash
node seu_nome_do_script.js
```

Substitua `seu_nome_do_script.js` pelo nome real do arquivo do script do WhatsApp.

## Funcionalidade

### Autenticação do WhatsApp

Ao executar o script, ele exibirá um Código QR usando `qrcode-terminal`. Escaneie este Código QR usando o aplicativo WhatsApp para autenticar o cliente.

### Adicionar Moldura e Texto a Imagens

1. Quando você receber uma mensagem de imagem no WhatsApp, o script verificará se ela também contém uma legenda (texto).

2. Se a imagem tiver uma legenda, o script adicionará o texto da legenda à imagem e colocará a imagem dentro de uma moldura.

3. Se o texto da legenda exceder o limite de 102 caracteres, o script responderá com uma mensagem de erro e solicitará que o usuário envie novamente a imagem e o texto da legenda com um comprimento de texto reduzido.

4. A imagem resultante com a moldura e o texto da legenda será enviada de volta ao usuário.

5. A imagem processada será temporariamente salva, e os arquivos temporários serão excluídos após o envio da imagem.

### Observação

- O script pressupõe que as imagens são enviadas com a legenda e que apenas uma imagem é enviada de cada vez.

- O script pode produzir comportamentos inesperados se outros tipos de mensagens ou várias imagens forem enviadas simultaneamente.

## Aviso Legal

Este script é fornecido apenas para fins educacionais e de demonstração. O WhatsApp pode ter políticas de uso e termos de serviço. Certifique-se de revisar e cumprir essas políticas para evitar problemas relacionados à conta.

**Use este script com responsabilidade e por sua conta e risco.**



# CAAP-Assist 🤖

This is a Node.js script that utilizes the `whatsapp-web.js` library to interact with WhatsApp and perform the following tasks:

1. Generate and display a QR Code to authenticate the WhatsApp client.
2. Provide feedback when the WhatsApp client is ready and connected.
3. Handle incoming messages, specifically images, and process them to add a frame and text before sending them back.

## Dependencies

Before running the script, you need to install the required dependencies:

1. [`qrcode-terminal`](https://www.npmjs.com/package/qrcode-terminal): Used to display the QR Code for WhatsApp authentication.
2. [`whatsapp-web.js`](https://www.npmjs.com/package/whatsapp-web.js): The WhatsApp client library.
3. [`canvas`](https://www.npmjs.com/package/canvas): For image processing, adding frames, and text to images.
4. [`fs`](https://nodejs.org/api/fs.html): The Node.js built-in filesystem module for reading and writing files.
5. [`image-size`](https://www.npmjs.com/package/image-size): To get the dimensions of images.

You can install these dependencies using the following command:

```bash
npm install qrcode-terminal whatsapp-web.js canvas fs image-size
```

## How to Use

1. Ensure you have Node.js installed on your machine.
2. Clone or download this script to your local machine.
3. Navigate to the script's directory in the terminal.
4. Run the script using the following command:

```bash
node your_script_name.js your_client_id
```

Replace `your_script_name.js` with the actual name of the script file and `your_client_id` with your WhatsApp client ID.

## Functionality

### WhatsApp Authentication

When you run the script, it will display a QR Code using `qrcode-terminal`. Scan this QR Code using your WhatsApp application to authenticate the client.

### Adding Frames and Text to Images

1. When you receive an image message on WhatsApp, the script will check if it also contains a caption (text).

2. If the image has a caption, it will add the caption text to the image and put it inside a frame.

3. If the caption text exceeds the limit of 102 characters, the script will reply with an error message and prompt the user to send the image and caption text again with reduced text length.

4. The resulting image with the added frame and caption text will be sent back to the user.

5. The processed image will be saved temporarily, and the temporary files will be deleted after sending the image.

### Note

- The script assumes that images are sent with the caption, and only one image is sent at a time.

- The script might produce unexpected behavior if other types of messages or multiple images are sent simultaneously.

## Disclaimer

This script is provided for educational and demonstration purposes only. WhatsApp might have usage policies and terms of service. Make sure to review and comply with those policies to avoid any account-related issues.

**Use this script responsibly, and at your own risk.**
