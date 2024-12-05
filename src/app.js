// Importação das bibliotecas necessárias
const oracledb = require('oracledb'); // Conectar ao banco de dados Oracle
const fs = require('fs'); // Manipulação de arquivos
const path = require('path'); // Manipulação de caminhos de arquivos
const express = require('express'); // Framework para criar aplicações web em Node.js
const bcrypt = require('bcrypt'); // Biblioteca para hashing de senhas
const session = require('express-session'); // Middleware para gerenciar sessões de usuários
const { body, validationResult } = require('express-validator'); // Middleware para validação de dados de entrada
const { start } = require('repl');

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
    const { cpf, Entrada } = req.body;

    console.log('Recebendo dados para entrada:', { cpf, Entrada });
    
    // Validação de entrada
    if (!cpf || !Entrada) {
        return res.status(400).json({ message: 'CPF, data e hora são obrigatórios.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Verifica se o CPF existe na tabela aluno
        const testecpf = await connection.execute(
            `SELECT COUNT(*) AS count FROM aluno WHERE cpf = :cpf`,
            [cpf]
        );

        // Acessa o valor do COUNT
        const alunoExiste = testecpf.rows[0][0]; 
        if (alunoExiste === 0) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado. CPF inválido.' });
        }

        // Verifica se há registro de entrada sem saída
        const frequenciaResult = await connection.execute(
            `SELECT Saida FROM frequencia WHERE CPF_aluno = :cpf AND Saida IS NULL`,
            [cpf]
        );

        if (frequenciaResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Já existe uma entrada sem saída registrada para este aluno.' });
        }

        // Insere um novo registro na tabela de frequência
        const sql = `
            INSERT INTO frequencia (CPF_aluno, Entrada)
            VALUES (:cpf,TO_TIMESTAMP(:Entrada, 'YYYY-MM-DD HH24:MI:SS'))
        `;
        
        const binds = {
            cpf,
            Entrada
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
    const { cpf, Saida } = req.body;

    if (!cpf) {
        return res.status(400).json({ success: false, message: 'CPF é obrigatório.' });
    }

    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Verifica se o aluno existe na tabela 'aluno'
        const alunoResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM aluno WHERE cpf = :cpf`,
            [cpf]
        );

        // Se o aluno não for encontrado
        if (alunoResult.rows[0][0] === 0) {
            return res.status(404).json({ success: false, message: 'Aluno não encontrado.' });
        }

        // Busca o último registro de entrada sem saída registrada
        const frequenciaResult = await connection.execute(
            `SELECT ID_frequencia FROM frequencia 
             WHERE CPF_aluno = :cpf AND Saida IS NULL 
             ORDER BY Entrada DESC, Entrada DESC FETCH FIRST 1 ROWS ONLY`,
            [cpf]
        );

        if (frequenciaResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Nenhum registro de entrada encontrado para este aluno.' });
        }

        const idFrequencia = frequenciaResult.rows[0][0];

        // Atualiza o registro com o horário de saída
        await connection.execute(
            `UPDATE frequencia SET Saida = TO_TIMESTAMP(:Saida, 'YYYY-MM-DD HH24:MI:SS') 
             WHERE ID_frequencia = :id`,
            { Saida, id: idFrequencia },
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
            `SELECT COUNT(*) AS count FROM aluno WHERE cpf = :cpf`, 
            [aluno.cpf] 
        );

        if (checkCpfResult.rows[0][0] > 0) {
            return { success: false, message: 'CPF já cadastrado.' }; 
        }

        const checkTelefoneResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM aluno WHERE telefone = :telefone`, 
            [aluno.telefone] 
        );

        if (checkTelefoneResult.rows[0][0] > 0) {
            return { success: false, message: 'Telefone já cadastrado.' }; 
        }

        const checkEmailResult = await connection.execute(
            `SELECT COUNT(*) AS count FROM aluno WHERE email = :email`, 
            [aluno.email] 
        );

        if (checkEmailResult.rows[0][0] > 0) {
            return { success: false, message: 'Email já cadastrado.' }; 
        }

        // Gera o hash da senha
        const hashedPassword = await bcrypt.hash(aluno.senha, 10); // 10 é o número de rounds para hash

        // Insere o aluno no banco de dados
        await connection.execute(
            `INSERT INTO aluno (nome, email, telefone, cpf, plano, senha) VALUES (:nome, :email, :telefone, :cpf, :plano, :senha)`,
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
            `SELECT COUNT(*) AS count FROM aluno WHERE cpf = :cpf`, 
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
                `DELETE FROM aluno WHERE cpf = :cpf`, 
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
        
        // Deleta todos os aluno da tabela
        await connection.execute(
            `DELETE FROM aluno`, 
            [], 
            { autoCommit: true } // Confirma a transação automaticamente
        );

        return { success: true, message: 'Todos os aluno deletados com sucesso!' }; 
    } catch (err) {
        console.error("Erro ao deletar todos os aluno:", err); 
        return { success: false, message: 'Erro ao deletar todos os aluno.' }; 
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

// Rota para deletar todos os aluno
app.delete('/deletar-todos-alunos', async (req, res) => {
    const result = await deletarTodosAlunos(); // Chama a função para deletar todos os aluno
    res.status(result.success ? 200 : 400).json(result); // Retorna a resposta com base no resultado
});

// Função para autenticar usuário (detecção automática de tipo)
async function autenticarUsuario(email, senha) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Verifica primeiro na tabela de aluno
        let result = await connection.execute(
            `SELECT * FROM aluno WHERE email = :email`, 
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


// Inicia o servidor na porta especificada
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`); 
});

// Adiciona o middleware de tratamento de erros
app.use(errorHandler);

// Testa a conexão ao iniciar o servidor
testConnection();


app.get('/getHorasTotais', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT aluno.nome, 
                    SUM(ROUND((CAST(f.saida AS DATE) - CAST(f.entrada AS DATE)) * 24, 2)) AS horas
             FROM aluno
             JOIN frequencia f ON aluno.cpf = f.cpf_aluno
             GROUP BY aluno.nome
             ORDER BY aluno.nome`
        );

        const alunosHorasTotais = result.rows.map(row => ({
            nome: row[0],
            horas: row[1]
        }));

        res.json(alunosHorasTotais);
    } catch (error) {
        console.error('Erro ao obter dados:', error);
        res.status(500).send('Erro ao obter dados');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.get('/getHorasUltimaSemana', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT aluno.nome, 
                    SUM(ROUND((CAST(f.saida AS DATE) - CAST(f.entrada AS DATE)) * 24, 2)) AS horas
             FROM aluno
             JOIN frequencia f ON aluno.cpf = f.cpf_aluno
             WHERE f.entrada >= SYSDATE - INTERVAL '7' DAY
             GROUP BY aluno.nome
             ORDER BY aluno.nome`
        );

        const alunosHorasUltimaSemana = result.rows.map(row => ({
            nome: row[0],
            horas: row[1]
        }));

        res.json(alunosHorasUltimaSemana);
    } catch (error) {
        console.error('Erro ao obter dados:', error);
        res.status(500).send('Erro ao obter dados');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});
app.get('/getHorasUltimaSemanaAluno', async (req, res) => {
    let connection;
    try {
        const { cpf } = req.query; // Obtém o CPF da consulta
        console.log('CPF recebido:', cpf);

        if (!cpf) {
            return res.status(400).send('CPF é obrigatório');
        }

        connection = await oracledb.getConnection(dbConfig);

        // Primeiro, verificar se o aluno existe
        const alunoCheck = await connection.execute(
            `SELECT nome FROM aluno WHERE cpf = :cpf`,
            { cpf }
        );

        if (alunoCheck.rows.length === 0) {
            return res.status(404).json({ mensagem: 'CPF não encontrado na tabela aluno' });
        }

        // Buscar registros de frequência para o aluno existente
        const result = await connection.execute(
            `SELECT aluno.nome, 
                    SUM(ROUND((CAST(f.saida AS DATE) - CAST(f.entrada AS DATE)) * 24, 2)) AS horas
             FROM aluno
             LEFT JOIN frequencia f ON aluno.cpf = f.cpf_aluno
             WHERE aluno.cpf = :cpf
               AND f.entrada >= SYSDATE - INTERVAL '7' DAY
             GROUP BY aluno.nome`,
            { cpf }
        );

        if (result.rows.length === 0 || result.rows[0][1] === null) {
            // Aluno existe, mas não possui registros de frequência
            return res.status(200).json({
                mensagem: 'Aluno encontrado, mas sem registros de frequência na última semana',
                nome: alunoCheck.rows[0][0]
            });
        }

        // Retornar os dados do aluno com horas registradas
        const alunoHorasUltimaSemana = {
            nome: result.rows[0][0],
            horas: result.rows[0][1]
        };

        res.json(alunoHorasUltimaSemana);
    } catch (error) {
        console.error('Erro ao obter dados:', error);
        res.status(500).send('Erro ao obter dados');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});