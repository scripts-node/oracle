"use strict";

/**
 * Inclui o módulo mongo
 */
const oracledb = require('oracledb');

/**
 * Inclui o módulo debug
 */
var debug = require('debug')(process.env.SERVICE_NAME || "mongo" + ':src:db');

/**
 * Classe para controle de cache com db
 */
class Oracle {

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
             * Configura processos de servidor dedicado e compartilhado, avaliar documentação da oracle
             * SERVER=DEDICATED
             */
            this.DEDICATED = (this.options.DEDICATED ? this.options.DEDICATED : (process.env.DEDICATED || ''));

            /**
             * O nome que aparece na coluna CLIENT_IDENTIFIER na view sessions do oracle
             */
            this.CLIENT_IDENTIFIER = (this.options.CLIENT_IDENTIFIER ? this.options.CLIENT_IDENTIFIER : (process.env.CLIENT_IDENTIFIER || 'oracleDb'));

            /**
             * Ip ou nome de host para conexão com o oracle
             */
            this.HOST = (this.options.HOST ? this.options.HOST : (process.env.HOST || 'localhost'));

            /**
             * Porta para conexão com o banco
             */
            this.PORT = (this.options.PORT ? this.options.PORT : (process.env.PORT || 1521));

            /**
             * Usuário de conexão com o banco de dados
             */
            this.USER = (this.options.USER ? this.options.USER : (process.env.USER || 'xe'));
            
            /**
             * Senha para conexão com o banco de dados
             */
            this.PSWD = (this.options.PSWD ? this.options.PSWD : (process.env.PSWD || ''));

            /**
             * Service_name do banco
             */
            this.SERVICE_NAME = (this.options.SERVICE_NAME ? this.options.SERVICE_NAME : (process.env.SERVICE_NAME || ''));

            /**
             * Sid do banco
             */
            this.SID = (this.options.SID ? this.options.SID : (process.env.SID || ''));

            /**
             * O mínimo de conexões que o pool mantem sempre abertas
             */
            this.POOL_MIN = (this.options.POOL_MIN ? this.options.POOL_MIN : (process.env.POOL_MIN || 0));

            /**
             * O número máximo de conexões que o pool pode abrir
             */
            this.POOL_MAX = (this.options.POOL_MAX ? this.options.POOL_MAX : (process.env.POOL_MAX || 5));

            /**
             * A quantidade de conexões que serão abertas sempre que o banco precisar incrementar o pool até o POOL_MAX ser atingido
             */
            this.POOL_INCREMENT = (this.options.POOL_INCREMENT ? this.options.POOL_INCREMENT : (process.env.POOL_INCREMENT || 1));

            /**
             * O número máximo de segundos que uma conexão pode permanecer ociosa em um pool de conexão (sem “check-out” para o aplicativo getConnection()) 
             * antes que o node-oracledb efetue ping no banco de dados antes de retornar essa conexão ao aplicativo.
             */
            this.POOL_PING_INTERVAL = (this.options.POOL_PING_INTERVAL ? this.options.POOL_PING_INTERVAL : (process.env.POOL_PING_INTERVAL || 60));

            /**
             * O número de segundos após os quais as conexões inativas (não utilizadas no pool) podem ser encerradas. 
             * Conexões ociosas são encerradas apenas quando o pool é acessado.
             */
            this.POOL_TIMEOUT = (this.options.POOL_TIMEOUT ? this.options.POOL_TIMEOUT : (process.env.POOL_TIMEOUT || 60));

            /**
             * O número de milissegundos após os quais os pedidos de conexão que aguardam na fila de pedidos de conexão são encerrados. 
             * Se queueTimeoutfor 0, as solicitações de conexão na fila nunca serão encerradas.
             */
            this.POOL_QUEUE_TIMEOUT = (this.options.POOL_QUEUE_TIMEOUT ? this.options.POOL_QUEUE_TIMEOUT : (process.env.POOL_QUEUE_TIMEOUT || 60000));

            /**
             * O número de instruções a serem armazenadas em cache no cache de instruções de cada conexão.
             */
            this.POOL_STMT_CACHE_SIZE = (this.options.POOL_STMT_CACHE_SIZE ? this.options.POOL_STMT_CACHE_SIZE : (process.env.POOL_STMT_CACHE_SIZE || 30));
            
            /*
             * Valida se a conexão usa processo compartilhado
             */
            if(this.DEDICATED.length > 0 && this.DEDICATED === "true" || this.DEDICATED === true){
                this.USE_DEDICATED = '(SERVER=dedicated)';
            }else{
                this.USE_DEDICATED = '';
            }

            /**
             * String montada para conexões com sid
             */
            this.STRING_SID = `(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=${this.HOST})(PORT=${this.PORT})))(CONNECT_DATA=(SID=${this.SID})${this.USE_DEDICATED}))`;

             /**
              * String montada para conexões com service_name
              */
            this.STRING_SERVICE_NAME = `(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=${this.HOST})(PORT=${this.PORT})))(CONNECT_DATA=(SERVICE_NAME=${this.SERVICE_NAME})${this.USE_DEDICATED}))`;

            /*
             * Valida se utiliza sid ou service_name
             */
            if(this.SID.length>0 && this.SERVICE_NAME.length>0){
                
                /**
                 * Log
                 */
                debug("Erro de configuração. Você configurou um sid e um service_name, utilize apenas um deles.");

                /**
                 * Finaliza o processo
                 */
                process.exit(2);
            }else{

                /**
                 * Valida se ao menos algum SID ou SERVICE_NAME foi configurado
                 */
                if(this.SID.length>0 || this.SERVICE_NAME.length>0){

                    /**
                     * Valida qual utiliza
                     */
                    if(this.SID.length>0){
                        this.STRING = this.STRING_SID;
                    }else{
                        this.STRING = this.STRING_SERVICE_NAME;
                    }
                }else{

                    /**
                     * Retorna um erro informando que nem o SID e nem o SERVICE_NAME foram configurados.
                     */
                    debug("Erro de configuração. Nenhum sid ou service_name foi informado.");

                    /**
                     * Finaliza o processo
                     */
                    process.exit(2);
                }
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
        debug("Estabelecendo conexão com o oracle através da porta %s e endereço %s, string completa: \n%s",this.PORT,this.HOST,this.STRING);

        /**
         * Cria a conexão com o banco de dados
         */
        oracledb.createPool({
            user                : c.USER,
            password            : c.PSWD,
            connectString       : c.STRING,
            poolIncrement       : c.POOL_INCREMENT,
            poolMax             : c.POOL_MAX,
            poolMin             : c.POOL_MIN,
            poolTimeout         : c.POOL_TIMEOUT,
            poolPingInterval    : c.POOL_PING_INTERVAL,
            stmtCacheSize       : c.POOL_STMT_CACHE_SIZE,
            queueTimeout        : c.POOL_QUEUE_TIMEOUT
        }).then(pool => {

            pool.getConnection().then(conn=>{
                
                /**
                 * log
                 */
                debug("Conexão estabelecida com sucesso.");

                /**
                 * Ajusta o status de conexão
                 */
                c.status = "connected";

                /**
                 * Repassa a conexão
                 */
                c.conn = conn;
                
            }).catch(error=>{

                /**
                 * log
                 */
                debug("Erro ao estabelecer conexão com o banco de dados: ",error);

                /**
                 * Finaliza o processo
                 */
                process.exit(2);
            });
        }).catch(error=>{

            /**
             * Log de erro
             */
            debug("Erro ao estabelecer conexão com o banco de dados.",error);

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
                    callback(null,r.conn);
                    return resolve(r.conn);
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
                            callback(null,r.conn);
                            return resolve(r.conn);
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

module.exports = Oracle
