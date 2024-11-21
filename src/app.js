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

// Função para autenticar aluno
async function autenticarAluno(email, senha) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig); 
        const result = await connection.execute(
            `SELECT * FROM alunos WHERE email = :email`, 
            [email] // Busca aluno pelo email
        );

        if (result.rows.length === 0) {
            return { success: false, message: 'Email não encontrado.' }; 
        }

        const aluno = result.rows[0]; // Obtém os dados do aluno

        const match = await bcrypt.compare(senha, aluno[3]); // Compara a senha fornecida com a armazenada

        if (!match) {
            return { success: false, message: 'Senha incorreta.' }; 
        }

        return { success: true, message: 'Aluno autenticado com sucesso!', aluno };
    } catch (err) {
        console.error("Erro ao autenticar aluno:", err); 
        return { success: false, message: 'Erro ao autenticar aluno.' }; 
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

// Rota para autenticar aluno
app.post('/autenticar-aluno', async (req, res) => {
    const { email, senha } = req.body; 
    console.log("Autenticando aluno:", { email, senha }); // Log dos dados de entrada
    const result = await autenticarAluno(email, senha); 
    console.log("Resultado da autenticação:", result); // Log do resultado
    if (result.success) {
        req.session.aluno = result.aluno; 
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

app.post(
    "/gerar-relatorio",
    [
      body("startDate").isISO8601().withMessage("Data inicial inválida."),
      body("endDate").isISO8601().withMessage("Data final inválida."),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      const { startDate, endDate, cpfAluno } = req.body;  // Adicionamos 'cpfAluno' ao corpo da requisição.
  
      if (!cpfAluno) {
        return res.status(400).json({ message: "CPF do aluno é obrigatório." });
      }
  
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
  
        // Caso o aluno exista, executa a consulta para gerar o relatório
        const query = `
          SELECT 
            f.CPF_aluno, 
            a.nome, 
            COUNT(f.ID_frequencia) AS total_presencas,
            SUM(EXTRACT(HOUR FROM (f.hora_saida - f.hora_entrada))) AS total_horas
          FROM frequencia f
          JOIN alunos a ON f.CPF_aluno = a.CPF
          WHERE f.data_entrada BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
          AND f.CPF_aluno = :cpfAluno
          GROUP BY f.CPF_aluno, a.nome
        `;
  
        const result = await connection.execute(query, { startDate, endDate, cpfAluno });
  
        res.json({
          message: "Relatório gerado com sucesso!",
          data: result.rows,
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
    }
  );  

// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`); 
});

// Adiciona o middleware de tratamento de erros
app.use(errorHandler);

// Testa a conexão ao iniciar o servidor
testConnection();
