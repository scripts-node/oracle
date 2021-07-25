# Exemplo simples de utilização do mongo

## Incluíndo a classe

```node
var oracle = require("./src/oracle");
```

## Chamada por callback

```node
new oracle().ready(conn => {
    conn.execute(`SELECT * FROM USER_OBJECTS`).then(result=>{
      console.log(result)
    }).catch(error=>{
      console.log(error)
    });
});
```

## Chamada por promise

```node
var conn = await new oracle().ready();
conn.execute(`SELECT * FROM USER_OBJECTS`).then(result=>{
  console.log(result)
}).catch(error=>{
  console.log(error)
});
```

## Passagem de parametros ou ENVS

Você pode fornecer parâmetros ou variáveis de ambiente de configuração ao instanciar a classe. Os seguintes parametros ou variáveis estão disponíveis:

* **sleep**: *`integer`* Aguarda **x** segundos antes de iniciar a conexão;
* **DEDICATED**: *`boolean`* Configura processos de servidor dedicado e compartilhado, avaliar documentação da oracle;
* **CLIENT_IDENTIFIER**: *`string`* O nome que aparece na coluna CLIENT_IDENTIFIER na view sessions do oracle;
* **HOST**: *`string`* Ip ou nome de host para conexão com o oracle;
* **PORT**: *`integer`* Porta para conexão com o banco;
* **USER**: *`string`* Usuário de conexão com o banco de dados;
* **PSWD**: *`string`* Senha para conexão com o banco de dados;
* **SERVICE_NAME**: *`string`* Service_name do banco;
* **SID**: *`string`* Sid do banco;
* **POOL_MIN**: *`integer`* O mínimo de conexões que o pool mantem sempre abertas;
* **POOL_MAX**: *`integer`* O número máximo de conexões que o pool pode abrir;
* **POOL_INCREMENT**: *`integer`* A quantidade de conexões que serão abertas sempre que o banco precisar incrementar o pool até o POOL_MAX ser atingido;
* **POOL_PING_INTERVAL**: *`integer`* O número máximo de segundos que uma conexão pode permanecer ociosa em um pool de conexão antes que o node-oracledb efetue ping no banco de dados antes de retornar essa conexão ao aplicativo;
* **POOL_TIMEOUT**: *`integer`* O número de segundos após os quais as conexões inativas (não utilizadas no pool) podem ser encerradas;
* **POOL_QUEUE_TIMEOUT**: *`integer`* O número de milissegundos após os quais os pedidos de conexão que aguardam na fila de pedidos de conexão são encerrados;
* **POOL_STMT_CACHE_SIZE**: *`integer`* O número de instruções a serem armazenadas em cache no cache de instruções de cada conexão;

Exemplo de utilização:

```node
new oracle({
  PARAMETRO: VALOR
}).ready();
```
