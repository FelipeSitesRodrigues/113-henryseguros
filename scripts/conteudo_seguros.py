# Conteúdo extra das 7 páginas de seguro (pedido do Paulo em 2026-11-19: "mais rico em informações").
# O dados.py junta isto aos seguros: "perguntas" soma às que já existem, o resto vira campo novo.
#   entendaTitulo, entenda (2 parágrafos)  -> seção "o que é" (sol-entenda)
#   precoTitulo, preco [ícone, título, linha] -> cartão ao lado do texto
#   extras [ícone, texto]                    -> "Pra deixar sob medida", dentro do cartão escuro (sol-cobre)
#   passosTitulo, passos [título, texto]     -> "se acontecer" / "do pedido ao contrato" (sol-passos)
# Regra: nada de número, prazo ou promessa que dependa da seguradora. Quando varia, dizer que varia.

MAIS = {
    "auto": dict(
        entendaTitulo=["Seguro auto,", "sem letra miúda."],
        entenda=[
            "O seguro auto paga o conserto ou o valor do carro em caso de batida, roubo, furto, incêndio ou alagamento, e cobre os danos que você causar a outras pessoas no trânsito. Na cobertura compreensiva, a mais contratada, tudo isso vem junto.",
            "O que muda de uma apólice pra outra são os detalhes: o valor da franquia, o limite pra terceiros, os dias de carro reserva, a rede de oficinas e o que a assistência 24h inclui. É nesses detalhes que a gente compara as seguradoras pra você.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["car-profile", "Modelo e ano do carro", "E o quanto ele é visado"], ["map-pin", "CEP de pernoite", "Onde o carro dorme e se tem garagem"], ["user", "Quem dirige", "Idade, tempo de habilitação e uso do carro"], ["medal", "Classe de bônus", "Anos sem sinistro baixam o preço"]],
        extras=[["users", "Limites maiores pra danos materiais, corporais e morais"], ["first-aid-kit", "Acidentes pessoais de passageiros"], ["car", "Carro reserva por mais dias"], ["wrench", "Martelinho de ouro e reparo rápido"], ["shield-check", "Blindagem, kit gás e acessórios"]],
        passosTitulo=["Bateu ou", "roubaram?"],
        passos=[["Fale com o consultor", "Pelo WhatsApp, logo depois do ocorrido. A gente diz o que fazer na hora."], ["Boletim de ocorrência", "Em roubo, furto e batida com terceiro. A gente ajuda a registrar."], ["Abertura do sinistro", "A gente abre na seguradora e acompanha a vistoria e a oficina."], ["Carro resolvido", "Conserto na oficina, com a franquia quando houver, ou indenização em caso de perda total."]],
        perguntas=[
            ["O que é franquia?", "É a parte do conserto que fica com você quando o dano é parcial. Franquia menor deixa o seguro mais caro, e maior deixa mais barato. A gente mostra as duas opções lado a lado."],
            ["Uso o carro pra aplicativo. Preciso avisar?", "Precisa. Uso comercial ou por aplicativo muda o risco, e informação errada na cotação pode levar a seguradora a negar o sinistro."],
            ["O seguro vale pra outro motorista?", "Vale, desde que o perfil informado esteja certo. Se alguém de 18 a 25 anos dirige o carro com frequência, isso precisa constar na apólice."],
        ],
    ),
    "residencial": dict(
        entendaTitulo=["Seguro residencial", "pra casa e pra rotina."],
        entenda=[
            "O seguro residencial protege o imóvel e o que tem dentro dele contra incêndio, raio, explosão, roubo e danos elétricos. E traz assistência 24h pros problemas do dia a dia, como cano estourado, tomada queimada ou porta trancada.",
            "Serve pra casa e apartamento, próprio ou alugado. Quem é dono protege a estrutura e os bens. Quem aluga protege os próprios bens e a responsabilidade por danos ao imóvel e aos vizinhos.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["house-line", "Tipo de imóvel", "Casa, apartamento ou condomínio"], ["map-pin", "Endereço", "A região e a segurança do local"], ["coins", "Valores de cobertura", "Quanto valem o imóvel e os bens"], ["wrench", "Plano de assistência", "Quais serviços e quantos usos"]],
        extras=[["house", "Aluguel pago se a casa ficar inabitável depois de um sinistro"], ["frame-corners", "Quebra de vidros"], ["car", "Impacto de veículos"], ["laptop", "Equipamentos eletrônicos"], ["dog", "Assistência pet, conforme a seguradora"]],
        passosTitulo=["Deu problema", "em casa?"],
        passos=[["Chame o consultor", "Ou a assistência 24h direto, se for urgente."], ["Assistência ou sinistro", "Cano, chave e tomada vão pra assistência. Incêndio, roubo e dano elétrico viram sinistro."], ["Vistoria e documentos", "A seguradora avalia o dano. A gente diz o que juntar: fotos, notas e boletim de ocorrência quando houver."], ["Indenização", "Paga dentro do valor contratado, com a franquia quando houver."]],
        perguntas=[
            ["Danos elétricos cobrem qualquer aparelho?", "Cobrem aparelhos e instalação danificados por variação de energia ou raio, dentro do limite contratado. Desgaste e defeito do próprio aparelho não entram."],
            ["O condomínio já tem seguro. Preciso de outro?", "O seguro do condomínio cobre a estrutura e as áreas comuns. O que está dentro do seu apartamento e a sua responsabilidade com os vizinhos ficam de fora."],
            ["Posso pagar parcelado?", "Pode. As seguradoras parcelam no cartão ou no boleto, e a gente mostra as opções na cotação."],
        ],
    ),
    "empresarial": dict(
        entendaTitulo=["Um seguro", "do tamanho da operação."],
        entenda=[
            "O seguro empresarial protege o prédio, as máquinas, os móveis e o estoque contra incêndio, roubo, danos elétricos e eventos da natureza. Com lucros cessantes, ele também ajuda a pagar as despesas fixas enquanto a empresa fica parada por causa de um sinistro.",
            "Cada negócio tem riscos diferentes: uma clínica, uma loja e uma fábrica não precisam da mesma apólice. Por isso a gente começa entendendo a atividade, o endereço e o que tem de valor lá dentro.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["briefcase", "Ramo de atividade", "Cada atividade tem um risco"], ["map-pin", "Endereço e construção", "Região, tipo de prédio e proteção"], ["coins", "Valores em risco", "Prédio, máquinas e estoque"], ["shield-check", "Proteções do local", "Alarme, extintores e monitoramento"]],
        extras=[["frame-corners", "Quebra de vidros, letreiros e anúncios"], ["desktop", "Equipamentos eletrônicos e portáteis"], ["wallet", "Roubo de valores no caixa e em trânsito"], ["snowflake", "Mercadoria perdida em freezer e câmara fria"], ["drop", "Danos causados por água e vazamentos"]],
        passosTitulo=["Aconteceu", "na empresa?"],
        passos=[["Fale com o consultor", "Antes de mexer no local, se for possível. A gente orienta o primeiro passo."], ["Registro e documentos", "Boletim de ocorrência em roubo, fotos do dano e notas fiscais dos bens."], ["Vistoria", "A seguradora avalia o prejuízo. A gente acompanha e cobra o andamento."], ["Indenização", "Dentro dos valores contratados, e lucros cessantes pelo período previsto na apólice."]],
        perguntas=[
            ["Tenho uma sala comercial pequena. Serve?", "Serve. Existem planos pra escritório, consultório e pequeno comércio, com valores proporcionais ao tamanho do negócio."],
            ["O seguro do prédio comercial cobre a minha sala?", "Ele cobre a estrutura e as áreas comuns. Equipamentos, móveis e mercadorias da sua empresa precisam de um seguro próprio."],
            ["Preciso das notas fiscais dos equipamentos?", "Na contratação, basta informar os valores. Na hora do sinistro, a nota ou outro comprovante ajuda a provar o que foi perdido."],
        ],
    ),
    "frota": dict(
        entendaTitulo=["Seguro frota,", "controle num lugar só."],
        entenda=[
            "O seguro frota junta os veículos da empresa numa mesma apólice: carros, utilitários e caminhões, com as coberturas de um seguro auto, como colisão, roubo, furto, danos a terceiros e assistência 24h.",
            "Em vez de vários vencimentos e várias seguradoras, a empresa tem uma renovação, um consultor e um controle só. Veículo novo entra na apólice, veículo vendido sai, sem refazer tudo.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["van", "Tipo e quantidade de veículos", "Carros, utilitários e caminhões"], ["map-pin", "Região de circulação", "Onde a frota roda e pernoita"], ["chart-bar", "Histórico de sinistros", "Quanto a frota já usou o seguro"], ["user", "Uso e motoristas", "Entregas, vendas ou transporte"]],
        extras=[["users", "Limites maiores pra danos a terceiros"], ["first-aid-kit", "Acidentes pessoais de motorista e passageiros"], ["car", "Carro reserva pra operação não parar"], ["frame-corners", "Vidros, faróis e retrovisores"], ["wrench", "Guincho com maior alcance"]],
        passosTitulo=["Um veículo", "parou?"],
        passos=[["Avise o consultor", "O motorista ou o gestor manda a placa e o que aconteceu."], ["Assistência", "Guincho e socorro saem pela assistência 24h."], ["Sinistro aberto", "A gente registra na seguradora e acompanha a vistoria e a oficina."], ["Caso fechado", "Veículo consertado ou indenizado, e o gestor recebe o resumo do caso."]],
        perguntas=[
            ["Posso ter coberturas diferentes por veículo?", "Pode. Um caminhão de entrega e o carro de um vendedor não precisam da mesma cobertura."],
            ["Os motoristas precisam ser nomeados?", "Depende da seguradora. Em geral a frota cobre quem dirige a serviço da empresa, dentro das regras da apólice."],
            ["Carro no nome do sócio pode entrar?", "Depende de como o veículo está registrado e da seguradora. A gente confere caso a caso."],
            ["Dá pra pagar mensalmente?", "Dá. As seguradoras parcelam o valor da frota, e a gente mostra as opções na cotação."],
        ],
    ),
    "fianca": dict(
        entendaTitulo=["O fiador,", "sem pedir favor a ninguém."],
        entenda=[
            "O seguro fiança é uma garantia de aluguel: a seguradora assume o papel do fiador e paga o proprietário se o inquilino deixar de pagar o aluguel e os encargos previstos no contrato. É uma das garantias previstas na Lei do Inquilinato.",
            "Quem aluga não precisa de fiador nem deixa meses de aluguel parados como caução. Antes de emitir, a seguradora analisa o cadastro e a renda de quem vai alugar.",
        ],
        precoTitulo="O que a seguradora analisa",
        preco=[["user", "Cadastro do inquilino", "CPF ou CNPJ e histórico"], ["wallet", "Renda", "Comparada ao valor do aluguel"], ["buildings", "Aluguel e encargos", "Condomínio, IPTU e contas"], ["shield-check", "Coberturas escolhidas", "Só aluguel ou também danos e multa"]],
        extras=[["drop", "Contas de água, luz e gás"], ["paint-roller", "Pintura interna e externa"], ["wrench", "Assistências pro imóvel, conforme o plano"]],
        passosTitulo=["Do pedido", "às chaves."],
        passos=[["Dados do inquilino", "Nome, CPF ou CNPJ, renda e o valor do aluguel."], ["Análise", "A gente envia pras seguradoras e acompanha a aprovação."], ["Proposta e pagamento", "Você escolhe a seguradora e a forma de pagar."], ["Contrato assinado", "A apólice vai pra imobiliária e o contrato segue sem fiador."]],
        perguntas=[
            ["Fui recusado numa seguradora. Acabou?", "Não necessariamente. Cada seguradora tem o próprio critério, e a gente pode tentar em outra."],
            ["Serve pra imóvel comercial?", "Serve. Existe seguro fiança pra loja, sala e escritório, com análise da empresa."],
            ["A análise demora?", "Costuma ser rápida, mas depende da seguradora e dos documentos. A gente acompanha e avisa assim que sair."],
            ["Sou imobiliária. Como faço parceria?", "A Henry tem um programa de parceria com imobiliárias e administradoras. Fale com o Paulo pelo WhatsApp."],
        ],
    ),
    "capitalizacao": dict(
        entendaTitulo=["Uma garantia", "que volta pra você."],
        entenda=[
            "No título de capitalização, o inquilino aplica um valor que fica guardado durante o contrato de aluguel como garantia pro proprietário. Se houver aluguel atrasado ou dano ao imóvel, esse valor pode ser usado pra cobrir a dívida, conforme o contrato.",
            "Se tudo correr bem, no fim do prazo o valor é resgatado conforme as regras do título. Enquanto isso, ele concorre a sorteios. É uma alternativa pra quem tem o dinheiro e prefere uma garantia que volta, em vez de pagar um seguro.",
        ],
        precoTitulo="O que definir antes",
        preco=[["coins", "Valor do título", "Combinado com a imobiliária"], ["calendar-blank", "Prazo", "Acompanha o contrato de locação"], ["ticket", "Sorteios", "Quantos e com que frequência"], ["arrow-u-up-left", "Regras de resgate", "Quando e quanto volta"]],
        extras=[],
        passosTitulo=["Do pedido", "ao resgate."],
        passos=[["Valor combinado", "Com a imobiliária, a gente define quanto o título precisa ter."], ["Pagamento", "Pagamento único ou parcelado, conforme o título, e ele é emitido."], ["Contrato garantido", "O título fica vinculado à locação durante o prazo."], ["Resgate", "No fim, sem pendências no aluguel, o valor volta conforme as regras do título."]],
        perguntas=[
            ["Precisa de análise de renda?", "Em geral, não como no seguro fiança, porque a garantia é o próprio valor aplicado."],
            ["E se eu atrasar o aluguel?", "O proprietário pode usar o valor do título pra cobrir a dívida, conforme o contrato. O que sobrar continua seu."],
            ["Serve pra imóvel comercial?", "Serve. O título também é usado como garantia em locação comercial."],
        ],
    ),
    "responsabilidade-civil": dict(
        entendaTitulo=["Quando o problema", "é com o outro."],
        entenda=[
            "O seguro de responsabilidade civil paga as indenizações que você ou a sua empresa tiverem de pagar a terceiros por danos materiais ou corporais, e cobre os custos de defesa, dentro dos limites contratados.",
            "Existem vários tipos: o profissional, pra quem pode errar no exercício da profissão; o geral, pra empresas que recebem público ou trabalham no local do cliente; e o de diretores, administradores e síndicos. A apólice certa depende do que você faz.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["briefcase", "Atividade exercida", "E os riscos dela"], ["coins", "Limite de indenização", "Quanto a apólice pode pagar"], ["chart-bar", "Faturamento ou porte", "No caso das empresas"], ["file-text", "Histórico de reclamações", "Pedidos ou processos anteriores"]],
        extras=[["users", "Danos morais"], ["calendar-blank", "Período retroativo pra trabalhos feitos antes da contratação"], ["wallet", "Prejuízo financeiro causado ao cliente"]],
        passosTitulo=["Recebeu", "uma reclamação?"],
        passos=[["Não resolva sozinho", "Fale com o consultor antes de assumir culpa ou fechar acordo."], ["Aviso à seguradora", "A gente comunica a reclamação dentro do prazo da apólice."], ["Defesa", "A seguradora analisa o caso e participa da defesa, conforme a apólice."], ["Indenização", "Se houver acordo ou condenação, paga dentro do limite contratado."]],
        perguntas=[
            ["Qual a diferença entre RC geral e RC profissional?", "O geral cobre danos da operação, como um cliente que se machuca na loja. O profissional cobre erro técnico no seu trabalho, como um projeto com falha."],
            ["Pessoa física pode contratar?", "Pode. Profissional liberal contrata no próprio nome."],
            ["Qual limite eu devo escolher?", "Depende do tamanho do dano que a sua atividade pode causar e do que o contrato exige. A gente ajuda a calcular."],
        ],
    ),
    "saude": dict(
        entendaTitulo=["Plano de saúde,", "explicado antes de assinar."],
        entenda=[
            "O plano de saúde dá acesso a consultas, exames, internações e outros atendimentos na rede da operadora, conforme o tipo de plano contratado. Os planos são regulados pela ANS, a Agência Nacional de Saúde Suplementar, que define a lista mínima de procedimentos que todos precisam cobrir.",
            "O que muda de um plano pro outro é a rede de hospitais e médicos, a área de cobertura, o tipo de quarto na internação, a coparticipação e o reembolso. É nesses detalhes que a gente compara as operadoras pra você.",
        ],
        precoTitulo="O que pesa no preço",
        preco=[["user", "Idade de cada pessoa", "O valor muda por faixa etária"], ["hospital", "Rede escolhida", "Hospitais e laboratórios incluídos"], ["bed", "Acomodação", "Enfermaria ou apartamento"], ["coins", "Coparticipação", "Mensalidade menor, pagando parte de cada uso"]],
        extras=[["tooth", "Plano odontológico junto"], ["airplane", "Assistência em viagem, conforme o plano"], ["receipt", "Reembolso maior pra médico fora da rede"]],
        passosTitulo=["Da cotação", "à carteirinha."],
        passos=[["Conversa", "Quem vai entrar no plano, idades, cidade e os médicos e hospitais que importam."], ["Comparação", "A gente cota nas operadoras e mostra as diferenças lado a lado."], ["Proposta", "Você escolhe, preenche a declaração de saúde e envia os documentos."], ["Plano ativo", "Com a proposta aceita, chega a carteirinha. E o consultor segue do seu lado."]],
        perguntas=[
            ["O que é carência?", "É o prazo entre a contratação e o direito de usar alguns atendimentos. A ANS define prazos máximos, e em alguns casos dá pra aproveitar a carência já cumprida em outro plano."],
            ["Como funciona o reajuste?", "Existe o reajuste anual e o por mudança de faixa etária. No plano empresarial, o anual é negociado com a operadora. A gente explica antes de você assinar."],
            ["Já tenho plano. Vale trocar?", "Pode valer. Comparamos o seu plano atual com o mercado e conferimos se a portabilidade de carências se aplica ao seu caso."],
        ],
    ),
}

