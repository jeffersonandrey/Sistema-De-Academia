const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');
const dbConfig = {
    user: 'SYSTEM',
    password: '123123',
    connectionString: 'localhost:1521/XEPDB1'
};

async function executeSqlFile(filePath) {
    let connection;
    try {
        console.log("Tentando conectar ao banco de dados...");
        connection = await oracledb.getConnection(dbConfig);
        console.log("Conexão estabelecida com sucesso!");

        console.log("Lendo arquivo SQL de: ", filePath);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log("SQL lido com sucesso!");

        const sqlCommands = sql.split(';'); 
        for (let command of sqlCommands) {
            if (command.trim()) {  
                console.log(`Executando comando: ${command}`);
                await connection.execute(command);
            }
        }

        console.log("Comandos executados com sucesso!");
    } catch (err) {
        console.error("Erro ao executar comandos SQL: ", err);
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log("Conexão encerrada.");
            } catch (err) {
                console.error("Erro ao fechar a conexão: ", err);
            }
        }
    }
}


const sqlFilePath = path.join(__dirname, '..', 'database', 'database.sql'); 
executeSqlFile(sqlFilePath);
