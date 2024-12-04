// Função para formatar data e hora no formato 'YYYY-MM-DD HH:MM:SS'
function formatarDataHora(data) {
    const pad = (num) => (num < 10 ? `0${num}` : num);
    const ano = data.getFullYear();
    const mes = pad(data.getMonth() + 1); // Meses são baseados em 0
    const dia = pad(data.getDate());
    const horas = pad(data.getHours());
    const minutos = pad(data.getMinutes());
    const segundos = pad(data.getSeconds());
    return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}
// Função para formatar CPF
function formatarCPF(cpf) {
    // Remove tudo o que não é número
    cpf = cpf.replace(/\D/g, '');

    // Verifica se o CPF tem 11 caracteres (o número esperado para um CPF válido)
    if (cpf.length === 11) {
        // Formata o CPF no formato XXX.XXX.XXX-XX
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return cpf; // Retorna o CPF sem formatação se não tiver o número correto de dígitos
}

document.getElementById('cpfAluno').addEventListener('blur', function (e) {
    e.target.value = formatarCPF(e.target.value);
});

// Função para registrar a entrada
async function registrarEntrada() {
    const cpfAluno = document.getElementById('cpfAluno').value.replace(/\D/g, '');
    const statusDiv = document.getElementById('status');

    if (!cpfAluno) {
        statusDiv.textContent = 'Por favor, insira o CPF do aluno.';
        statusDiv.style.color = 'red';
        return;
    }

    const agora = new Date();
    const Entrada = formatarDataHora(agora); // Formato 'YYYY-MM-DD HH:MM:SS'

    console.log('Hora:', Entrada);

    try {
        const response = await fetch(`/entrada`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cpf: cpfAluno,
                Entrada: Entrada
            })
        });

        const result = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Entrada registrada com sucesso!';
            statusDiv.style.color = 'green';
            document.getElementById('registrarSaida').disabled = false;
        } else {
            statusDiv.textContent = `Erro: ${result.message}`;
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
    const cpfAluno = document.getElementById('cpfAluno').value.replace(/\D/g, '');
    const statusDiv = document.getElementById('status');

    if (!cpfAluno) {
        statusDiv.textContent = 'Por favor, insira o CPF do aluno.';
        statusDiv.style.color = 'red';
        return;
    }

    const agora = new Date();
    const Saida = formatarDataHora(agora); // Formato 'YYYY-MM-DD HH:MM:SS'
    console.log('Hora:', Saida);
    try {
        const response = await fetch(`/saida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cpf: cpfAluno,
                Saida: Saida
            })  
        });

        const result = await response.json();
        if (response.ok) {
            statusDiv.textContent = 'Saída registrada com sucesso!';
            statusDiv.style.color = 'green';
            document.getElementById('registrarSaida').disabled = true;
        } else {
            statusDiv.textContent = `Erro: ${result.message}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Erro ao registrar saída:', error);
        statusDiv.textContent = 'Erro ao registrar saída. Tente novamente.';
        statusDiv.style.color = 'red';
    }   
}