"use strict";

/**
 * Inclui o módulo mongo
 */
 var mongoDb = require('mongodb');

/**
 * Inclui o módulo debug
 */
var debug = require('debug')(process.env.SERVICE_NAME || "mongo" + ':src:db');

/**
 * Classe para controle de cache com db
 */
class Mongo {

    constructor(options) {

            /**
             * Transfere para variável a propriedade this para ser usada dentro das funções
             */
            var c = this;

            /**
             * Transpassa options
             */
            this.options = {};

            /**
             * Valida se existe parametro options
             */
            if(options)
                this.options = options;

            /**
             * Porta de conexão com Mongo
             */
            this.port = (this.options.MONGO_PORT ? this.options.MONGO_PORT : (process.env.MONGO_PORT || 27017));

            /**
             * Ip de conexão com o mongo
             */
            this.address = (this.options.MONGO_ADDRESS ? this.options.MONGO_ADDRESS : (process.env.MONGO_ADDRESS || '127.0.0.1'));

            /**
             * Usuário de conexão com o mongo
             */
            this.username = (this.options.MONGO_USERNAME ? this.options.MONGO_USERNAME : (process.env.MONGO_USERNAME || ""));

            /**
             * Senha de conexão com o mongo
             */
            this.password = (this.options.MONGO_PASSWORD ? this.options.MONGO_PASSWORD : (process.env.MONGO_PASSWORD || ""));

            /**
             * Nome do db mongo
             */
            this.dbName = (this.options.MONGO_NAME ? this.options.MONGO_NAME : (process.env.MONGO_NAME || "test"));
            
            /*
             * Valida se foi fornecido usuário para autentição
             */
            if(this.username === ""){
                this.mongoString = `mongodb://${this.address}:${this.port}`
            }else{
                this.mongoString = `mongodb://${this.username}:${this.password}@${this.address}:${this.port}/writeapp?authSource=admin`
            }
            
            /**
             * Se a conexão com o banco precisar aguardar alguns segundos antes de ser iniciada
             */
            
            if(Number.isInteger(this.options.sleep)){

                /**
                 * Log
                 */
                debug("Aguardando %s segundos antes de iniciar a conexão com mongoDb.",this.options.sleep);

                /**
                 * Seta o timer para iniciar a conexão
                 */
                setTimeout(()=>{
                    this.startConnection();
                },(this.options.sleep * 1000));
            }else{

                /**
                 * Estabelece a conexão com o banco de dados.
                 */
                this.startConnection();
            }
    }

    startConnection(){

        /**
         * Transfere para variável a propriedade this para ser usada dentro das funções
         */
        var c = this;
        
        /**
         * LOG
         */
        debug("Estabelecendo conexão com o mongo através da porta %s e endereço %s",this.port,this.address);

        /**
         * Realiza a conexão com o banco
         */
        mongoDb.MongoClient.connect(this.mongoString,{useUnifiedTopology: true}).then(function(conn){

            /**
             * Seta o nome do banco a ser utilizado
             */
            c.db = conn.db(c.dbName);

            /**
             * Seta o uso de bucket
             */
            c.bucket = new mongoDb.GridFSBucket(c.db);

            /**
             * Mensagem de debug
             */
            debug('Conexão estabelecida com sucesso. Utilizando db name %s',c.dbName);

            /**
             * Cria um marcador para informar que a conexão foi estabelecida.
             */
            c.status = "connected";
        }).catch(error => {

            /**
             * LOG
             */
            debug("Erro ao estabelecer conexão com o mongoDb.",error);

            /**
             * Finaliza o processo
             */
            process.exit(2);
        });
    }

    /**
     * Metodo que é executado quando a conexão com mongo estiver pronta
     * @param {function} callback 
     * @returns 
     */
    ready(callback){
        
        /**
         * Transfere a manupulação da propriedade this para a variavel para usar dentro das funções
         */
        var r = this;

        /**
         * Retorna uma promise
         */
        return new Promise((resolve,reject)=>{

            /**
             * Se o db estiver conectado
             */
            if(r.status=="connected"){

                /**
                 * Retorna que está pronta
                 */
                if(callback)
                    callback(null,r.db);
                    return resolve(r.db);
            }else{

                /**
                 * Cria um controle com o número de tentativas de conexão com db
                 */
                this.attempt = 1;

                /**
                 * Cria um temporiazado
                 */
                var interval = setInterval(()=>{

                    /**
                     * Avalia se a conexão com db já está pronta
                     */
                    if(r.status=="connected"){

                        /**
                         * Finaliza o temporizador
                         */
                        clearInterval(interval)

                        /**
                         * Retorna que está pronta
                         */
                        if(callback)
                            callback(null,r.db);
                            return resolve(r.db);
                    }else{

                        /**
                         * Se o número máximo de tentativas de conexão for atingido
                         */
                        if(this.attempt>=30){

                            /**
                             * Finaliza o temporizador
                             */
                            clearInterval(interval);

                            /**
                             * Mensagem de retorno
                             */
                            var errorMessage = "Tempo esgotado para conexão com o banco de dados.";

                            /**
                             * Retorna que apresentou falha
                             */
                            if(callback)
                                return callback(errorMessage);
                                return reject(errorMessage);
                        }else{

                            /**
                             * Incrementa mais tempo ao temporizador
                             */
                            this.attempt ++;
                        }
                    }
                },1000);
            }
        }).catch((error) => {
            debug(error)
            process.exit(2)
        });
    }
}

module.exports = Mongo