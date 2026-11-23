# Gera src/dados/solucoes.json, src/dados/faq.json e src/paginas.json a partir da copy-site.md v1.
# Uso: python scripts/dados.py
import json

S = [
    dict(id="auto", rota="/seguro-auto", nome="Seguro Auto", curto="Auto", l1="Seguro", l2="Auto.", icone="car-profile", mensagem="Seguro Auto",
         descricao="Colisão, roubo, terceiros e assistência 24h.",
         widgets=[["car-profile", "Assistência 24h · Guincho a caminho"]],
         alt="Carro escuro numa avenida arborizada de Alphaville ao pôr do sol",
         h1a="Seu carro coberto.", h1b="E alguém pra ligar.",
         sub="Seguro auto com as principais seguradoras e um consultor que resolve guincho, oficina e sinistro por você.",
         botao="Cotar meu seguro auto",
         paraQuemTitulo=["Feito para", "quem depende do carro."],
         paraQuem=[["car-profile", "Carro novo ou financiado", "Quem não pode ficar sem ele"], ["users-three", "Família com mais de um carro", "Todos na mesma conversa"], ["bank", "Quem quer sair do seguro do banco", "E entender o que paga"]],
         cobre=[["car-profile", "Colisão, incêndio, roubo e furto"], ["users", "Danos a terceiros: o carro, a casa ou a pessoa atingida"], ["truck", "Assistência 24h com guincho, chaveiro e pane seca"], ["car", "Carro reserva enquanto o seu está na oficina"], ["sun-horizon", "Vidros, faróis e retrovisores"]],
         porque=["Comparamos as seguradoras pro seu perfil de motorista e de CEP", "Na batida, você liga pro consultor, não pra central", "Revisão na renovação pra não pagar por cobertura que não usa"],
         perguntas=[["O que muda o preço do seguro auto?", "Modelo do carro, CEP onde ele dorme, idade e histórico de quem dirige. Por isso a cotação é feita pra você."], ["Posso usar a oficina que eu confio?", "Depende da seguradora e do plano. Mostramos essa diferença antes de você escolher."], ["Tenho bônus em outra seguradora. Perco?", "Não. O bônus vem junto na troca."]]),
    dict(id="residencial", rota="/seguro-residencial", nome="Seguro Residencial", curto="Residencial", l1="Seguro", l2="Residencial.", icone="house-line", mensagem="Seguro Residencial",
         descricao="Incêndio, roubo, danos elétricos e assistência.",
         widgets=[["lightning", "Danos elétricos · Coberto"], ["key", "Chaveiro 24h · Disponível"]],
         alt="Casa contemporânea de condomínio em Alphaville com as luzes acesas ao pôr do sol",
         h1a="Sua casa protegida,", h1b="por dentro e por fora.",
         sub="Proteção contra incêndio, roubo e danos elétricos, com assistência pra encanador, eletricista e chaveiro quando precisar.",
         botao="Cotar meu seguro residencial",
         paraQuemTitulo=["Feito para", "quem cuida do lar."],
         paraQuem=[["house-line", "Casa ou apartamento próprio", "O imóvel e o que tem dentro"], ["key", "Quem mora de aluguel", "Seus bens e sua responsabilidade"], ["tree-palm", "Casa de condomínio", "Com bens de valor dentro"]],
         cobre=[["fire", "Incêndio, raio e explosão"], ["lock-key", "Roubo e furto qualificado"], ["lightning", "Danos elétricos em aparelhos e na instalação"], ["wind", "Vendaval e alagamento"], ["users", "Responsabilidade civil familiar"], ["wrench", "Assistência 24h: encanador, eletricista, chaveiro e vidraceiro"]],
         porque=["Valor de cobertura calculado pro que você tem de verdade, sem sobra e sem falta", "Um consultor pra chamar quando o problema aparece no domingo", "Coberturas explicadas antes de assinar"],
         perguntas=[["Quem mora de aluguel pode contratar?", "Pode. O seguro cobre os seus bens e a sua responsabilidade."], ["A assistência 24h tem limite de uso?", "Tem, e varia por plano. Mostramos antes de você contratar."], ["Cobre o que está dentro de casa?", "Sim, conforme o valor que você define pros bens."]]),
    dict(id="empresarial", rota="/seguro-empresarial", nome="Seguro Empresarial", curto="Empresarial", l1="Seguro", l2="Empresarial.", icone="buildings", mensagem="Seguro Empresarial",
         descricao="Imóvel, equipamentos, estoque e faturamento.",
         widgets=[["briefcase", "Lucros cessantes · Ativo"]],
         alt="Empresária abrindo a porta de vidro do escritório ao pôr do sol",
         h1a="Seu negócio", h1b="não para por um imprevisto.",
         sub="Proteção para o imóvel, os equipamentos e o estoque da sua empresa, montada pra atividade que você exerce.",
         botao="Cotar seguro empresarial",
         paraQuemTitulo=["Feito para", "quem tem uma empresa."],
         paraQuem=[["storefront", "Loja, escritório e consultório", "Quem recebe cliente todo dia"], ["factory", "Indústria e depósito", "Com estoque e máquinas"], ["file-text", "Contrato ou locação", "Que exige apólice"]],
         cobre=[["fire", "Incêndio, raio e explosão no imóvel e no conteúdo"], ["lock-key", "Roubo de equipamentos e mercadoria"], ["lightning", "Danos elétricos em máquinas"], ["chart-line-down", "Lucros cessantes: o faturamento que deixa de entrar com a empresa parada"], ["users", "Responsabilidade civil do estabelecimento"]],
         porque=["Entendemos a operação antes de cotar", "Um consultor pra todas as apólices da empresa", "Revisão quando a empresa cresce, muda de endereço ou compra equipamento"],
         perguntas=[["Minha empresa é pequena. Vale a pena?", "Quanto menor a empresa, mais um incêndio ou um roubo pesa. Mostramos o custo antes."], ["Lucros cessantes é obrigatório?", "Não, mas é o que mantém as contas pagas enquanto a empresa se recupera."], ["Cobre funcionário?", "Acidente de funcionário entra em outro seguro. Indicamos o certo pro seu caso."]]),
    dict(id="frota", rota="/seguro-frota", nome="Seguro Frota", curto="Frota", l1="Seguro", l2="Frota.", icone="van", mensagem="Seguro Frota",
         descricao="Todos os veículos da empresa juntos.",
         widgets=[["van", "Veículo incluído na apólice"]],
         alt="Vans e caminhonetes brancas de empresa numa rodovia ao pôr do sol",
         h1a="A frota inteira", h1b="numa apólice só.",
         sub="Carros, utilitários e caminhões da empresa cobertos juntos, com um consultor cuidando de inclusão, troca e sinistro.",
         botao="Cotar seguro frota",
         paraQuemTitulo=["Feito para", "empresa que roda."],
         paraQuem=[["briefcase", "Equipe de vendas ou de campo", "Carros na rua todo dia"], ["truck", "Transportadora e entregas", "Utilitários e caminhões"], ["wrench", "Prestadora de serviço", "Veículos que levam a equipe"]],
         cobre=[["car-profile", "Colisão, roubo e furto de todos os veículos"], ["users", "Danos a terceiros"], ["truck", "Assistência 24h pra frota inteira"], ["plus-circle", "Inclusão e exclusão de veículo durante a vigência"]],
         porque=["Uma renovação por ano, não uma por carro", "Um consultor que conhece cada veículo da frota", "Sinistro acompanhado do começo ao fim"],
         perguntas=[["A partir de quantos veículos é frota?", "Varia por seguradora. Conte quantos você tem e a gente vê a melhor forma."], ["Dá pra incluir carro no meio do ano?", "Dá. Ele entra na mesma apólice."]]),
    dict(id="fianca", rota="/seguro-fianca", nome="Seguro Fiança", curto="Fiança", l1="Seguro", l2="Fiança.", icone="key", mensagem="Seguro Fiança",
         descricao="Alugue sem fiador e sem depósito.",
         widgets=[["check-circle", "Cadastro aprovado"]],
         alt="Casal sorrindo com a chave nova num apartamento vazio ao pôr do sol",
         h1a="Alugue sem fiador", h1b="e sem caução.",
         sub="O seguro fiança substitui o fiador no contrato de aluguel e libera o dinheiro que iria pro depósito.",
         botao="Cotar seguro fiança",
         paraQuemTitulo=["Feito para", "quem vai alugar."],
         paraQuem=[["user", "Quem não tem fiador", "E não quer pedir pra ninguém"], ["wallet", "Quem não quer caução", "Três aluguéis parados"], ["storefront", "Empresa alugando ponto", "Comercial ou escritório"]],
         cobre=[["calendar-x", "Aluguel não pago"], ["buildings", "Condomínio e IPTU"], ["paint-roller", "Danos ao imóvel na saída"], ["file-x", "Multa por rescisão"]],
         porque=["Ajudamos a conversar com a imobiliária", "Comparamos o custo entre as seguradoras", "Um consultor do pedido ao contrato assinado"],
         perguntas=[["Quem paga o seguro fiança?", "Normalmente o inquilino, junto com o aluguel ou à vista."], ["A imobiliária aceita?", "A maioria aceita. Confirmamos com ela antes."], ["O valor volta no fim do contrato?", "Não. Ele funciona como seguro, não como depósito. Se quiser algo que devolve, veja o Título de Capitalização."]]),
    dict(id="capitalizacao", rota="/titulo-de-capitalizacao", nome="Título de Capitalização", curto="Capitalização", l1="Título de", l2="Capitalização.", icone="coins", mensagem="Título de Capitalização",
         descricao="Garantia de aluguel com resgate e sorteios.",
         widgets=[["coins", "Resgate no fim do contrato"]],
         alt="Mão segurando um chaveiro com a chave nova diante da janela ao pôr do sol",
         h1a="Garantia de aluguel", h1b="que volta pra você.",
         sub="Um valor guardado durante o contrato que serve de garantia pro proprietário, concorre a sorteios e é resgatado no fim.",
         botao="Saber mais sobre capitalização",
         paraQuemTitulo=["Feito para", "quem quer garantia com resgate."],
         paraQuem=[["key", "Inquilino", "Que prefere uma garantia que volta"], ["piggy-bank", "Quem quer guardar", "De forma organizada"], ["file-text", "Empresa", "Que precisa de garantia em contrato"]],
         cobre=[["coins", "Você aplica um valor de uma vez ou em parcelas"], ["ticket", "Durante a vigência, ele concorre a sorteios"], ["arrow-u-up-left", "No fim do prazo, você resgata conforme as regras do título"]],
         cobreTitulo=["Como", "funciona."],
         porque=["Explicamos a diferença pro seguro fiança e pra caução, com números", "Mostramos as condições de resgate antes da assinatura", "Um consultor pra tirar dúvida durante o contrato"],
         perguntas=[["Capitalização é investimento?", "Não. É uma forma de guardar dinheiro com sorteio. O resgate segue as regras do título e pode ser menor que o valor pago se for antes do prazo."], ["Fiança ou capitalização: qual é melhor?", "Depende de você ter o valor disponível agora. A gente faz a conta com você."]]),
    dict(id="responsabilidade-civil", rota="/responsabilidade-civil", nome="Responsabilidade Civil", curto="Responsabilidade Civil", l1="Responsabilidade", l2="Civil.", icone="shield-check", mensagem="Responsabilidade Civil",
         descricao="Proteção contra danos a terceiros.",
         widgets=[["shield-check", "Defesa e indenização · Cobertas"]],
         alt="Arquiteta de capacete branco lendo a planta numa obra ao pôr do sol",
         h1a="Um erro não pode", h1b="custar seu patrimônio.",
         sub="Cobertura para indenizações a terceiros por danos causados pela sua empresa ou no exercício da sua profissão.",
         botao="Cotar responsabilidade civil",
         paraQuemTitulo=["Feito para", "quem responde por terceiros."],
         paraQuem=[["stethoscope", "Profissional liberal", "Médico, dentista, engenheiro, arquiteto, advogado"], ["storefront", "Empresa que recebe público", "Ou presta serviço na casa do cliente"], ["buildings", "Síndico, condomínio e eventos", "Quem organiza e administra"]],
         cobre=[["users", "Danos materiais e corporais a terceiros"], ["scales", "Custos de defesa e honorários"], ["handshake", "Acordos e indenizações dentro do limite contratado"], ["briefcase", "Responsabilidade civil profissional (erro ou omissão)"]],
         porque=["Apólice desenhada pra atividade, não genérica", "Leitura das exclusões com você antes de contratar", "Consultor do lado na hora da reclamação"],
         perguntas=[["Meu contrato exige seguro de RC. Vocês fazem?", "Sim. Mandamos a apólice no formato que o contrato pede."], ["Cobre processo antigo?", "Em geral não. Por isso vale contratar antes de precisar."]]),
]

FAQ = [
    ["Quanto custa um seguro?", "Depende do que vai ser protegido e do seu perfil. Por isso a cotação é feita para você, e não sai de tabela. Ela é gratuita e sem compromisso."],
    ["Em quanto tempo recebo a cotação?", "Na maioria dos casos, no mesmo dia útil. Empresa e frota podem levar um pouco mais, porque comparamos várias seguradoras."],
    ["Com quais seguradoras vocês trabalham?", "Com Porto Seguro, Tokio Marine, Bradesco Seguros, Allianz, HDI, Yelum, SulAmérica, Zurich e Suhai. Comparamos entre elas e indicamos a que faz mais sentido para você."],
    ["O que acontece quando eu preciso acionar o seguro?", "Você chama o seu consultor. Ele abre o processo na seguradora, cuida dos documentos e acompanha até o fim."],
    ["Atendem só Alphaville?", "O escritório fica em Alphaville, Barueri, mas o atendimento funciona por WhatsApp e videochamada, então dá pra cuidar do seu seguro de onde você estiver."],
    ["Posso trocar meu seguro atual pela Henry?", "Pode. Comparamos sua apólice com o mercado e, se valer a pena, fazemos a troca na renovação ou antes, conforme o caso."],
    ["Vocês atendem empresas?", "Sim. Seguro empresarial, frota e responsabilidade civil, com um consultor cuidando de todas as apólices da empresa."],
]

PAG = [
    dict(id="home", nome="Início", arquivo="index.html", rota="/", titulo="Henry Seguros | Corretora de Seguros em Alphaville",
         descricao="Corretora de seguros em Alphaville com consultor dedicado. Auto, residencial, empresarial, frota e fiança nas principais seguradoras.",
         ogTitulo="Henry Seguros | Um consultor seu, não uma central",
         ogDescricao="Corretora de seguros em Alphaville, Barueri. Auto, residencial, empresarial, frota, fiança, capitalização e responsabilidade civil nas principais seguradoras.",
         ogAlt="Paulo, fundador da Henry Seguros, apertando a mão de um cliente ao pôr do sol", zap="consultor", tipoSchema="WebPage", paulo=True,
         secoes=["97-abertura", "01-hero", "02-seguradoras", "03-solucoes", "03b-imobiliarias", "03c-depoimentos", "04-diferenciais", "05-como-funciona", "06-sobre", "07-objecoes", "08-faq", "08b-blog", "09-cta"]),
    dict(id="sobre", nome="Sobre", arquivo="sobre.html", rota="/sobre", titulo="Sobre a Henry Seguros | Corretora em Alphaville",
         descricao="Conheça a Henry Seguros, corretora em Alphaville desde 2022, e o fundador, Paulo Henrique de Oliveira. Um consultor seu, não uma central.",
         ogTitulo="Sobre a Henry Seguros | Uma corretora feita de gente",
         ogDescricao="Desde 2022 em Alphaville, protegendo famílias e empresas com um consultor de verdade do lado.",
         ogAlt="Paulo Henrique de Oliveira, fundador da Henry Seguros, na varanda do escritório em Alphaville", zap="paulo", tipoSchema="AboutPage", paulo=True,
         secoes=["sob-topo", "06-sobre", "04-diferenciais", "02-seguradoras", "05-como-funciona", "09-cta"]),
    dict(id="privacidade", nome="Política de Privacidade", arquivo="privacidade.html", rota="/privacidade", titulo="Política de Privacidade | Henry Seguros",
         descricao="Como a Henry Seguros, corretora em Alphaville, trata os dados de quem pede cotação pelo site, conforme a LGPD.",
         ogTitulo="Política de Privacidade | Henry Seguros", ogDescricao="Como a Henry Seguros trata os seus dados, conforme a LGPD.",
         ogAlt="Henry Seguros", zap="duvida", tipoSchema="WebPage",
         secoes=["priv-texto", "09-cta"]),
]


# conteúdo extra das páginas de seguro (scripts/conteudo_seguros.py): soma perguntas e cria os campos novos
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteudo_seguros import MAIS
for item in S:
    extra = dict(MAIS[item["id"]])
    item["perguntas"] = item["perguntas"] + extra.pop("perguntas", [])
    item.update(extra)


def gravar(arq, obj):
    with open(arq, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


gravar("src/dados/solucoes.json", {"_sobre": "Os 7 seguros: cartões da Home, rodapé e uma página por seguro (rota). Texto da copy-site.md v1. Gerado por scripts/dados.py.", "itens": S})
gravar("src/dados/faq.json", {"itens": [{"pergunta": p, "resposta": r} for p, r in FAQ]})
gravar("src/paginas.json", {"_sobre": "Páginas fixas. As 7 de seguro saem do src/dados/solucoes.json no build.mjs, com as seções sol-*. Gerado por scripts/dados.py.", "itens": PAG})
print("ok")
