const API_URL = 'http://localhost:3000'; // Substitua pelo endpoint da sua API

// Função para registrar a entrada
async function registrarEntrada() {
    const cpfAluno = document.getElementById('cpfAluno').value.trim();
    const statusDiv = document.getElementById('status');

    if (!cpfAluno) {
        statusDiv.textContent = 'Por favor, insira o CPF do aluno.';
        statusDiv.style.color = 'red';
        return;
    }

    const horaAtual = new Date().toISOString();

    try {
        const response = await fetch(`${API_URL}/entrada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cpf: cpfAluno, // Aqui você envia 'cpf' ao invés de 'cpfAluno'
                dataEntrada: horaAtual.slice(0, 10),
                horaEntrada: horaAtual
            })
            
        });

        const result = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Entrada registrada com sucesso!';
            statusDiv.style.color = 'green';
            document.getElementById('registrarSaida').disabled = false;
        } else {
            statusDiv.textContent = `Erro: ${result.mensagem}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Erro ao registrar entrada:', error);
        statusDiv.textContent = 'Erro ao registrar entrada. Tente novamente.';
        statusDiv.style.color = 'red';
    }
}

// Função para registrar a saída
async function registrarSaida() {
    const cpfAluno = document.getElementById('cpfAluno').value.trim();
    const statusDiv = document.getElementById('status');

    if (!cpfAluno) {
        statusDiv.textContent = 'Por favor, insira o CPF do aluno.';
        statusDiv.style.color = 'red';
        return;
    }

    const horaAtual = new Date().toISOString();

    try {
        const response = await fetch(`${API_URL}/saida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cpfAluno,
                horaSaida: horaAtual // YYYY-MM-DDTHH:mm:ss.sssZ
            })
        });

        const result = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Saída registrada com sucesso!';
            statusDiv.style.color = 'green';
            document.getElementById('registrarSaida').disabled = true;
        } else {
            statusDiv.textContent = `Erro: ${result.mensagem}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Erro ao registrar saída:', error);
        statusDiv.textContent = 'Erro ao registrar saída. Tente novamente.';
        statusDiv.style.color = 'red';
    }
}
