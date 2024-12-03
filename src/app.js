// Importação das bibliotecas necessárias
const oracledb = require('oracledb'); // Conectar ao banco de dados Oracle
const fs = require('fs'); // Manipulação de arquivos
const path = require('path'); // Manipulação de caminhos de arquivos
const express = require('express'); // Framework para criar aplicações web em Node.js
const bcrypt = require('bcrypt'); // Biblioteca para hashing de senhas
const session = require('express-session'); // Middleware para gerenciar sessões de usuários
const { body, validationResult } = require('express-validator'); // Middleware para validação de dados de entrada

// Configuração do banco de dados Oracle
const dbConfig = {
    user: 'SYSTEM', 
    password: '123123', 
    connectionString: 'localhost:1521/XEPDB1' 
};

const app = express(); // Cria uma nova instância do aplicativo Express
const port = 3000; // Define a porta onde o servidor escutará

// Middleware para parsing de requisições JSON e URL-encoded
app.use(express.json()); // Permite que o aplicativo entenda requisições JSON
app.use(express.urlencoded({ extended: true })); // Permite que o aplicativo entenda requisições URL-encoded
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve arquivos estáticos da pasta 'public'

// Configuração da sessão
app.use(session({
    secret: '8@XnqZ3$sD%hK7pL!aQ9v', // Chave secreta para assinar a sessão
    resave: false, // Não re-salva a sessão se não foi modificada
    saveUninitialized: true // Salva sessões não inicializadas
}));

// Rota inicial que serve o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html')); 
});

// Middleware de tratamento de erros
function errorHandler(err, req, res, next) {
    console.error(err.stack); // Loga a pilha de erros no console
    res.status(500).send('Alguma coisa deu errado!'); 
}

// Função para testar a conexão com o banco de dados
async function testConnection() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig); // Tenta conectar ao banco de dados
        console.log("Conexão bem-sucedida!"); 
    } catch (err) {
        console.error("Erro ao conectar ao banco de dados:", err); 
    } finally {
        if (connection) {
            try {
                await connection.close(); 
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err); 
            }
        }
    }
}

// Função para validar CPF
function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica formato e dígitos iguais

    let sum = 0; 
    let remainder; 

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.charAt(i - 1)) * (11 - i); // Soma os produtos dos dígitos
    }
    remainder = (sum * 10) % 11; // Calcula o resto da divisão
    remainder = remainder === 10 || remainder === 11 ? 0 : remainder; // Ajusta o resto
    if (remainder !== parseInt(cpf.charAt(9))) return false; // Verifica o primeiro dígito

    // Validação do segundo dígito verificador
    sum = 0; 
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.charAt(i - 1)) * (12 - i); // Soma os produtos dos dígitos
    }
    remainder = (sum * 10) % 11; // Calcula o resto da divisão
    remainder = remainder === 10 || remainder === 11 ? 0 : remainder; // Ajusta o resto
    return remainder === parseInt(cpf.charAt(10)); // Retorna true ou false
}
app.post('/entrada', async (req, res) => {
    const { cpf, dataEntrada, horaEntrada } = req.body;

    console.log('Recebendo dados para entrada:', { cpf, dataEntrada, horaEntrada });
    
    // Validação de entrada
    if (!cpf || !dataEntrada || !horaEntrada) {
        return res.status(400).json({ message: 'CPF, data e hora são obrigatórios.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Verifica se o CPF existe na tabela alunos
        const testecpf = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE cpf = :cpf`,
            [cpf]
        );

        // Acessa o valor do COUNT
        const alunoExiste = testecpf.rows[0][0]; 
        if (alunoExiste === 0) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado. CPF inválido.' });
        }

        // Verifica se há registro de entrada sem saída
        const frequenciaResult = await connection.execute(
            `SELECT hora_saida FROM frequencia WHERE CPF_aluno = :cpf AND hora_saida IS NULL`,
            [cpf]
        );

        if (frequenciaResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Já existe uma entrada sem saída registrada para este aluno.' });
        }

        // Insere um novo registro na tabela de frequência
        const sql = `
            INSERT INTO frequencia (CPF_aluno, data_entrada, hora_entrada)
            VALUES (:cpf, TO_DATE(:dataEntrada, 'YYYY-MM-DD'), TO_TIMESTAMP(:horaEntrada, 'YYYY-MM-DD HH24:MI:SS'))
        `;
        
        const binds = {
            cpf,
            dataEntrada,
            horaEntrada
        };

        const result = await connection.execute(sql, binds, { autoCommit: true });
        console.log('Entrada registrada:', result);

        res.status(200).json({ message: 'Entrada registrada com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);

        // Responde com um erro genérico em caso de falha
        res.status(500).json({ message: 'Erro ao registrar entrada.', error: error.message });
    } finally {
        // Fecha a conexão com o banco de dados
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Erro ao fechar a conexão:', err);
            }
        }
    }
});


// Rota para registrar a saída de um aluno
app.post('/saida', async (req, res) => {
    const { cpf, horasaida } = req.body;

    if (!cpf) {
        return res.status(400).json({ success: false, message: 'CPF é obrigatório.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Verifica se o aluno existe na tabela 'alunos'
        const alunoResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE cpf = :cpf`,
            [cpf]
        );

        // Se o aluno não for encontrado
        if (alunoResult.rows[0][0] === 0) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado.' });
        }

        // Busca o último registro de entrada sem saída registrada
        const frequenciaResult = await connection.execute(
            `SELECT ID_frequencia FROM frequencia 
             WHERE CPF_aluno = :cpf AND hora_saida IS NULL 
             ORDER BY data_entrada DESC, hora_entrada DESC FETCH FIRST 1 ROWS ONLY`,
            [cpf]
        );

        if (frequenciaResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhum registro de entrada encontrado para este aluno.' });
        }

        const idFrequencia = frequenciaResult.rows[0][0];

        // Atualiza o registro com o horário de saída
        await connection.execute(
            `UPDATE frequencia SET hora_saida = TO_TIMESTAMP(:horaSaida, 'YYYY-MM-DD HH24:MI:SS') 
             WHERE ID_frequencia = :id`,
            { horasaida, id: idFrequencia },
            { autoCommit: true }
        );

        res.json({ success: true, message: 'Saída registrada com sucesso.' });
    } catch (err) {
        console.error("Erro ao registrar saída:", err);
        res.status(500).json({ success: false, message: 'Erro ao registrar saída.' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err);
            }
        }
    }
});
// Função para cadastrar um aluno no banco de dados
async function cadastrarAluno(aluno) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig); // Tenta conectar ao banco de dados

        // Verificação de CPF, telefone e email duplicados
        const checkCpfResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE cpf = :cpf`, 
            [aluno.cpf] 
        );

        if (checkCpfResult.rows[0][0] > 0) {
            return { success: false, message: 'CPF já cadastrado.' }; 
        }

        const checkTelefoneResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE telefone = :telefone`, 
            [aluno.telefone] 
        );

        if (checkTelefoneResult.rows[0][0] > 0) {
            return { success: false, message: 'Telefone já cadastrado.' }; 
        }

        const checkEmailResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE email = :email`, 
            [aluno.email] 
        );

        if (checkEmailResult.rows[0][0] > 0) {
            return { success: false, message: 'Email já cadastrado.' }; 
        }

        // Gera o hash da senha
        const hashedPassword = await bcrypt.hash(aluno.senha, 10); // 10 é o número de rounds para hash

        // Insere o aluno no banco de dados
        await connection.execute(
            `INSERT INTO alunos (nome, email, telefone, cpf, plano, senha) VALUES (:nome, :email, :telefone, :cpf, :plano, :senha)`,
            [aluno.nome, aluno.email, aluno.telefone, aluno.cpf, aluno.plano, hashedPassword], 
            { autoCommit: true } // Confirma a transação automaticamente
        );

        return { success: true, message: 'Aluno cadastrado com sucesso!' }; 
    } catch (err) {
        console.error("Erro ao cadastrar aluno:", err); 
        return { success: false, message: 'Erro ao cadastrar aluno.' }; 
    } finally {
        if (connection) {
            try {
                await connection.close(); 
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err); 
            }
        }
    }
}

// Rota para cadastrar um aluno com validação
app.post('/cadastrar-aluno', [
    body('nome').notEmpty().withMessage('Nome é obrigatório.'), 
    body('email').isEmail().withMessage('Email inválido.'), 
    body('telefone').notEmpty().withMessage('Telefone é obrigatório.'), 
    body('cpf').notEmpty().withMessage('CPF é obrigatório.').custom(cpf => {
        if (!isValidCPF(cpf)) {
            throw new Error('CPF inválido.'); 
        }
        return true; 
    }),
    body('plano').notEmpty().withMessage('Plano é obrigatório.'), 
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres.') 
], async (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) {
        console.log(errors.array()); 
        return res.status(400).json({
            success: false,
            message: errors.array().map(error => error.msg) 
        });
    }

    const aluno = req.body; // Obtém os dados do aluno do corpo da requisição
    const result = await cadastrarAluno(aluno); // Chama a função para cadastrar o aluno
    res.status(result.success ? 200 : 400).json(result); // Retorna a resposta com base no resultado
});

// Função para deletar aluno pelo CPF
async function deletarAluno(cpf) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Verifica se o aluno existe
        const checkResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM alunos WHERE cpf = :cpf`, 
            [cpf]
        );

        console.log("Resultado da consulta:", checkResult);

        // Verifica se o resultado contém linhas
        if (checkResult.rows.length > 0) {
            const count = checkResult.rows[0][0]; // Acessando o primeiro elemento da primeira linha
            console.log("Resultado da verificação do CPF:", count);
            
            if (count === 0) {
                return { success: false, message: 'Aluno não encontrado.' };
            }

            // Se o aluno existe, deletar
            await connection.execute(
                `DELETE FROM alunos WHERE cpf = :cpf`, 
                [cpf], 
                { autoCommit: true } // Confirma a transação automaticamente
            );

            return { success: true, message: 'Aluno deletado com sucesso!' }; 
        } else {
            return { success: false, message: 'Erro ao verificar o aluno.' };
        }
    } catch (err) {
        console.error("Erro ao deletar aluno:", err); 
        return { success: false, message: 'Erro ao deletar aluno.' }; 
    } finally {
        if (connection) {
            try {
                await connection.close(); 
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err); 
            }
        }
    }
}

// Rota para deletar aluno
app.delete('/deletar-aluno/:cpf', async (req, res) => {
    const { cpf } = req.params; // Obtém o CPF do parâmetro da URL
    const result = await deletarAluno(cpf); // Chama a função para deletar o aluno
    res.status(result.success ? 200 : 400).json(result); // Retorna a resposta com base no resultado
});

async function deletarTodosAlunos() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Deleta todos os alunos da tabela
        await connection.execute(
            `DELETE FROM alunos`, 
            [], 
            { autoCommit: true } // Confirma a transação automaticamente
        );

        return { success: true, message: 'Todos os alunos deletados com sucesso!' }; 
    } catch (err) {
        console.error("Erro ao deletar todos os alunos:", err); 
        return { success: false, message: 'Erro ao deletar todos os alunos.' }; 
    } finally {
        if (connection) {
            try {
                await connection.close(); 
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err); 
            }
        }
    }
}

// Rota para deletar todos os alunos
app.delete('/deletar-todos-alunos', async (req, res) => {
    const result = await deletarTodosAlunos(); // Chama a função para deletar todos os alunos
    res.status(result.success ? 200 : 400).json(result); // Retorna a resposta com base no resultado
});

// Função para autenticar usuário (detecção automática de tipo)
async function autenticarUsuario(email, senha) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Verifica primeiro na tabela de alunos
        let result = await connection.execute(
            `SELECT * FROM alunos WHERE email = :email`, 
            [email]
        );

        let tipo = 'aluno'; // Assume que é aluno
        if (result.rows.length === 0) {
            // Se não encontrado, verifica na tabela de administradores
            result = await connection.execute(
                `SELECT * FROM administradores WHERE email = :email`, 
                [email]
            );
            tipo = 'admin'; // Ajusta para administrador se encontrado
        }

        if (result.rows.length === 0) {
            return { success: false, message: 'Email não encontrado em nenhuma conta.' };
        }

        const usuario = result.rows[0]; // Dados do usuário encontrado
        const senhaArmazenada = usuario[3]; // Índice da senha no resultado

        const match = await bcrypt.compare(senha, senhaArmazenada); // Compara as senhas

        if (!match) {
            return { success: false, message: 'Senha incorreta.' };
        }

        return { 
            success: true, 
            message: `${tipo === 'admin' ? 'Administrador' : 'Aluno'} autenticado com sucesso!`, 
            usuario, 
            tipo 
        };
    } catch (err) {
        console.error("Erro ao autenticar usuário:", err);
        return { success: false, message: 'Erro ao autenticar usuário.' };
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Erro ao fechar a conexão:", err);
            }
        }
    }
}

// Rota para autenticar usuário
app.post('/autenticar', async (req, res) => {
    const { email, senha } = req.body;

    console.log("Autenticando usuário:", { email, senha }); // Log dos dados de entrada
    const result = await autenticarUsuario(email, senha);
    console.log("Resultado da autenticação:", result); // Log do resultado

    if (result.success) {
        if (result.tipo === 'admin') {
            req.session.admin = result.usuario; // Armazena na sessão como administrador
        } else {
            req.session.aluno = result.usuario; // Armazena na sessão como aluno
        }
    }

    res.status(result.success ? 200 : 400).json(result);
});

// Rota para obter os dados do aluno autenticado
app.get('/dados-aluno', (req, res) => {
    if (!req.session.aluno) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' }); // Retorna erro se não autenticado
    }
    res.json({ success: true, aluno: req.session.aluno });
});

app.post("/gerar-relatorio", async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { startDate, endDate, cpfAluno } = req.body;

    // Verificando se o CPF foi enviado corretamente
    if (!cpfAluno || cpfAluno.length !== 11) {
      return res.status(400).json({ message: 'CPF do aluno é obrigatório e deve ter 11 dígitos.' });
    }

    // Função para ajustar as datas para o primeiro e último segundo do dia
    const ajustarDataInicioFim = (dataISO) => {
        const data = new Date(dataISO);

        // Ajustando a data para o primeiro segundo do dia (00:00:00.000)
        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);  // 00:00:00.000

        // Ajustando a data para o último segundo do dia (23:59:59.999)
        const dataFim = new Date(data);
        dataFim.setHours(23, 59, 59, 999);  // 23:59:59.999

        return {
            inicio: dataInicio,
            fim: dataFim
        };
    };

    // Formatar as datas recebidas no formato esperado pelo Oracle
    const { inicio: formattedStartDate, fim: formattedEndDate } = ajustarDataInicioFim(startDate);
    const { inicio: formattedEndDateStart, fim: formattedEndDateEnd } = ajustarDataInicioFim(endDate);

    // Função para converter datas no formato correto para Oracle
    const formatOracleDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // Formatar as datas ajustadas para Oracle
    const formattedStartDateOracle = formatOracleDate(formattedStartDate);
    const formattedEndDateOracle = formatOracleDate(formattedEndDate);

    let connection;
    try {
      connection = await oracledb.getConnection({
        user: "system",
        password: "123123",
        connectString: "localhost/XEPDB1",
      });

      // Verificando se o aluno existe na tabela de alunos
      const alunoQuery = `SELECT COUNT(*) AS aluno_count FROM alunos WHERE CPF = :cpfAluno`;
      const alunoResult = await connection.execute(alunoQuery, { cpfAluno });

      if (alunoResult.rows[0].ALUNO_COUNT === 0) {
        return res.status(404).json({ message: "Aluno não encontrado." });
      }

      // Consultando as frequências no período e calculando o tempo total de visita
      const query = `
        SELECT
            a.nome AS nome_aluno,
            COUNT(f.ID_frequencia) AS quantidade_visitas,
            SUM(
              CASE
                  WHEN f.hora_saida IS NOT NULL AND f.hora_entrada IS NOT NULL THEN
                      EXTRACT(HOUR FROM (f.hora_saida - f.hora_entrada)) 
                      + EXTRACT(MINUTE FROM (f.hora_saida - f.hora_entrada)) / 60
                  ELSE
                      0
              END
            ) AS tempo_total
        FROM
            frequencia f
        JOIN
            alunos a ON TRIM(f.CPF_aluno) = TRIM(a.cpf)
        WHERE
            TRIM(f.CPF_aluno) = :cpfAluno  
            AND f.data_entrada >= TO_TIMESTAMP(:startDate, 'YYYY-MM-DD HH24:MI:SS')
            AND f.data_entrada < TO_TIMESTAMP(:endDate, 'YYYY-MM-DD HH24:MI:SS')
        GROUP BY
            a.nome`;

      console.log(`Consultando com CPF: ${cpfAluno}, Start Date: ${formattedStartDate}, End Date: ${formattedEndDate}`);

      const result = await connection.execute(query, { 
        startDate: formattedStartDate, 
        endDate: formattedEndDate, 
        cpfAluno 
      });

      // Verificar se a consulta retornou resultados
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Nenhuma visita encontrada para o aluno no período especificado." });
      }

      // Convertendo o tempo total de visitas (em horas)
      const tempoTotalEmHoras = result.rows[0].TEMPO_TOTAL;
      const tempoTotalEmMinutos = tempoTotalEmHoras * 60;

      // Definindo a classificação com base no total de horas
      let classificacao;
      if (tempoTotalEmHoras < 10) {
        classificacao = 'Baixa Frequência';
      } else if (tempoTotalEmHoras >= 10 && tempoTotalEmHoras < 30) {
        classificacao = 'Frequência Moderada';
      } else {
        classificacao = 'Alta Frequência';
      }

      // Inserindo os dados na tabela 'relatorio'
      const insertQuery = `
        INSERT INTO relatorio (CPF_aluno, data_referencia, total_horas, classificacao)
        VALUES (:cpf_aluno, TO_DATE(:data_referencia, 'YYYY-MM-DD'), :total_horas, :classificacao)`;

      const dataReferencia = formattedEndDateOracle;

      await connection.execute(insertQuery, {
        cpf_aluno: cpfAluno,
        data_referencia: formattedEndDateOracle,
        total_horas: tempoTotalEmHoras.toFixed(2),
        classificacao: classificacao,
      });

      // Commit para garantir que os dados sejam gravados na tabela 'relatorio'
      await connection.commit();

      // Retornando os dados para o front-end
      res.json({
        message: "Relatório gerado com sucesso e dados inseridos no banco!",
        data: {
          nome_aluno: result.rows[0].NOME_ALUNO,
          quantidade_visitas: result.rows[0].QUANTIDADE_VISITAS,
          tempo_total_horas: tempoTotalEmHoras.toFixed(2),
          tempo_total_minutos: tempoTotalEmMinutos.toFixed(0),
          classificacao: classificacao,
        },
      });
    } catch (err) {
      console.error("Erro ao acessar o banco:", err);
      res.status(500).json({ message: "Erro interno no servidor." });
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Erro ao fechar a conexão:", err);
        }
      }
    }
});


  

// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`); 
});

// Adiciona o middleware de tratamento de erros
app.use(errorHandler);

// Testa a conexão ao iniciar o servidor
testConnection();
