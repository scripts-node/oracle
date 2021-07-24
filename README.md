# Exemplo simples de utilização do mongo

## Incluíndo a classe

```node
var mongo = require("./src/mongo");
```

## Chamada por callback

```node
new mongo().ready(db => {
  var dados = await db.collection("minhacollection").find().toArray();
  console.log(dados);
});
```

## Chamada por promise

```node
var db = await new mongo().ready();
var dados = await db.collection("minhacollection").find().toArray();
console.log(dados);
```

## Passagem de parametros

Você pode fornecer parâmetros de configuração ao instanciar a classe. Os seguintes parametros estão disponíveis:

* **sleep**: *`integer`* Aguarda **x** segundos antes de iniciar a conexão;
* **MONGO_PORT**: *`integer`* Define a porta de conexão com o mongoDb;
* **MONGO_ADDRESS**: *`string`* Define o endereço de conexão com o mongoDb;
* **MONGO_USERNAME**: *`string`* Define o usuário de conexão com o mongoDb;
* **MONGO_PASSWORD**: *`string`* Define a senha de conexão com o mongoDb;
* **MONGO_NAME**: *`string`* Define a porta de conexão com o mongoDb;

Exemplo de utilização:

```node
new mongo({
  PARAMETRO: VALOR
}).ready();
```
