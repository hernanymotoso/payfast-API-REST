module.exports = function(app){
    app.get('/pagamentos', function(req, res){
        console.log('Recebida requisição de teste');
        res.send('pagamentos');
    });
    
    // recurso

    app.get('/pagamentos/pagamento/:id', function(req, res){
       
        var id = req.params.id;

        console.log('consultando pagamento ' + id);

        var memcachedClient = app.servicos.memcachedClient();

        memcachedClient.get('pagamento-' + id, function(erro, retorno){
            if(erro || !retorno){
                console.log('MISS - chave não encontrada');

                var connection = app.persistencia.connectionFactory();
                var pagamentoDao = new app.persistencia.PagamentoDao(connection);
        
                pagamentoDao.buscaPorId(id, function(erro, resultado){
                    if(erro){
                        console.log('Erro ao consultar no banco' + erro);
                        res.status(500).send(erro);
                        return;
                    }
        
                    console.log('Pagamento encontrado: ' + JSON.stringify(resultado));
                    res.json(resultado);
                    return;
        
                });

                // HIT no cache
            }else{
                console.log('HIT - valor: ' + JSON.stringify(retorno));
                res.json(retorno);
                return;
            }

        });


       
    });

    app.delete('/pagamentos/pagamento/:id', function(req, res){

        var pagamento = {};

        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CANCELADO';

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(erro){
            if(erro){
                res.status(500).send(erro);
                return;
            }

            console.log('Pagamento cancelado');

            /*
            var memcachedClient = app.servicos.memcachedCLient();
            memcachedClient.set('pagamento-' + pagamento.id, pagamento, 60000, function(erro){
                if(erro){
                    console.log('Erro no memcachedCLient ' + erro); 
                    res.status(400).send(erro);
                    return; 
                }
                    
                console.log('nova chave adicionada ao cache: pagamento-' + pagamento.id);

            });  */




            res.status(204).send(pagamento);
        });
    });

    app.put('/pagamentos/pagamento/:id', function(req, res){

        var pagamento = {};

        var id = req.params.id;

        pagamento.id = id;
        pagamento.status = 'CONFIRMADO';  

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.atualiza(pagamento, function(erro){
            if(erro){
                res.status(500).send(erro);
                return;
            }

            console.log('Pagamento confirmado');

 
            /*
            var memcachedClient = app.servicos.memcachedCLient();
            memcachedClient.set('pagamento-' + pagamento.id, pagamento, 60000, function(erro){
                if(erro){
                    console.log('Erro no memcachedCLient ' + erro); 
                    res.status(400).send(erro);
                    return; 
                }
                    
                console.log('nova chave adicionada ao cache: pagamento-' + pagamento.id);

            });  */


            res.send(pagamento);
        });

    });


    app.post('/pagamentos/pagamento', function(req, res){

        req.assert('pagamento.forma_de_pagamento', 'Forma de pagamento é obrigatório').notEmpty();
        req.assert('pagamento.valor', 'Valor é obrigatório e deve ser um decimal').notEmpty().isFloat();

        var erros = req.validationErrors();
        if(erros){
            console.log('Erros de validação encontrados')
            res.status(400).send(erros);
            return;
        }
      
        var pagamento = req.body["pagamento"];

        console.log('processando uma requisição de um novo pagamento');

        pagamento.status = 'CRIADO';
        pagamento.data = new Date;

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.salva(pagamento, function(erro, resultado){
            if(erro){
                console.log('Erro ao inserir no banco:' + erro);
                res.status(500).send(erro);
            }else{  
                
                pagamento.id = resultado.insertId;
                
                console.log('pagamento criado');  

 
                var memcachedClient = app.servicos.memcachedClient();      
                memcachedClient.set('pagamento-' + pagamento.id, pagamento, 60000, function(erro){
                    if(erro){
                        console.log('Erro no memcachedCLient ' + erro); 
                        res.status(400).send(erro);
                        return; 
                    }
                        
                    console.log('nova chave adicionada ao cache: pagamento-' + pagamento.id);

                });

                if(pagamento.forma_de_pagamento == 'cartao'){
                    var cartao = req.body['cartao'];
                    console.log(cartao);  

                    var clienteCartoes = new app.servicos.clienteCartoes();
                    clienteCartoes.autoriza(cartao, function(exception, request, response, retorno){
                        if(exception){
                            console.log(exception['message']);
                            res.status(400).send(exception['message']);  
                            return;
                        }
                        console.log(retorno);

                        res.location('/pagamentos/pagamento' + pagamento.id);

                        var response = {
                            dados_do_pagamento: pagamento,
                            cartao: retorno,
                            links: [
                                {
                                    href:"http://localhost:80/pagamentos/pagamento" + pagamento.id,
                                    rel: "confirmar",
                                    method:"PUT"
                                },
                                {
                                    href:"http://localhost:80/pagamentos/pagamento" + pagamento.id,
                                    rel: "cancelar",
                                    method:"DELETE"
                                }
                            ]
                        }
                        res.status(201).json(response);  
                        return;

                    });
                   
                  
                } else {

                    res.location('/pagamentos/pagamento/' + pagamento.id);   
                    
                    var response = {
                        dados_do_pagamento: pagamento,
                        links: [
                            {
                                href: "http://localhost:80/pagamentos/pagamento/" + pagamento.id, 
                                rel: "confirmar",
                                method: "PUT"
                            },
                            {
                                href: "http://localhost:80/pagamentos/pagamento/" + pagamento.id,
                                rel: "cancelar",
                                method: "DELETE"
                            }
                        ]

                    };
                    
                    res.status(201).json(response);
                }
            }    
        }); 


    });







}



