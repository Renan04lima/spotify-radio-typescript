# Spotify Radio - Semana JS Expert 6.0

Projeto simula uma transmissão de rádio, onde o controlador pode *iniciar*, *parar* e *adicionar efeitos sonoros* na transmissão de aúdio.

Marque esse projeto com uma estrela 🌟

## Preview

<img src="./prints/demo.png" />

## Roda projeto

Precisar ter o docker-compose e o node v17 instalado, para seguir os passos a seguir:

1. Clonar repositório
2. Instalar depedências
```sh
npm install
```
3. Comando para roda os testes
```sh
npm run test:coverage:docker
```
4. Comando para rodar em modo dev na porta 3000
  ```sh
  npm run dev:docker
  ```


## Estrutura do Projeto

- server
  - service = tudo que é regra de negocio ou processamento
  - controller = intermediar a camada de apresentação e a camada de negocio
  - routes = camada de apresentação 
  - server = responsavel por criar o servidor (mas nao instancia)
  - index = instancia o servidor e expoe para a web (lado da infraestrura)
  - config = tudo que for estático do projeto

- public
  - service = tudo que é regra de negocio ou processamento
  - controller = é o intermedio entre a view e o service
  - view = tudo que é elemento HTML (visualizacao)
  - index = Factory = quem inicializa tudo

## Checklist Features

- Web API
    - [x] Deve atingir 100% de cobertura de código em testes
    - [x] Deve ter testes de integração validando todas as rotas da API
    - [x] Deve entregar arquivos estáticos como Node.js Stream
    - [x] Deve entregar arquivos de música como Node.js Stream
    - [x] Dado um usuário desconectado, não deve quebrar a API
    - [x] Mesmo que vários comandos sejam desparados ao mesmo tempo, não deve quebrar a API
    - [x] Caso aconteça um erro inesperado, a API deve continuar funcionando
    - [x] O projeto precisa ser executado em ambientes Linux, Mac e Windows

- Web App 
    - Client
        - [x] Deve reproduzir a transmissão
        - [x] Não deve pausar se algum efeito for adicionado
    - Controller
        - [x] Deve atingir 100% de cobertura de código em testes
        - [x] Deve poder iniciar ou parar uma transmissão 
        - [x] Deve enviar comandos para adicionar audio efeitos à uma transmissão

## Tarefas por aula

  - [x] Aula 01: Cobrir as camadas service e route com testes unitários e alcançar 100% de code coverage
  - [x] Aula 02: Manter 100% de code coverage e implementar testes e2e para toda a API
  - [x] Aula 03: implementar testes unitários para o frontend e manter 100% de code coverage
  - **PLUS**: 
      - [ ] disponibilizar um novo efeito
          - [ ] adicionar um botão novo no controlador
          - [ ] adicionar um som de efeito novo para a pasta `audios/fx/`
          - [ ] republicar no heroku

### Créditos aos áudios usados

#### Transmissão 
- [English Conversation](https://youtu.be/ytmMipczEI8)

#### Efeitos
- [Applause](https://youtu.be/mMn_aYpzpG0)
- [Applause Audience](https://youtu.be/3IC76o_lhFw)
- [Boo](https://youtu.be/rYAQN11a2Dc)
- [Fart](https://youtu.be/4PnUfYhbDDM)
- [Laugh](https://youtu.be/TZ90IUrMNCo)
## FAQ 
- `NODE_OPTIONS` não é um comando reconhecido pelo sistema, o que fazer?
    - Se você estiver no Windows, a forma de criar variáveis de ambiente é diferente. Você deve usar a palavra `set` antes do comando. 
    - Ex: `    "test": "set NODE_OPTIONS=--experimental-vm-modules && npx jest --runInBand",`

- Rodei `npm test` mas nada acontece, o que fazer?
    - Verifique a versão do seu Node.js. Estamos usando na versão 17. Entre no [site do node.js](https://nodejs.org) e baixe a versão mais recente.
