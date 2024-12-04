// Função para mostrar mensagens
function showMessage(message) {
    document.getElementById("message").innerText = message;
}

// Função para limpar mensagens
function clearMessage() {
    document.getElementById("message").innerText = '';
}

document.getElementById('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(); // Limpa a mensagem anterior

    const alunos = {
        cpf: document.getElementById('cpf').value.replace(/\D/g, ''), 
        nome: document.getElementById('name').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('tel').value,
        plano: document.getElementById('dropdown').value
    };
    
    try {
        const response = await fetch('/cadastrar-aluno', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alunos)
        });
        
        const result = await response.json();
        
        // Exibir a mensagem de cadastro
        showMessage(result.message);
        
        // Limpar os campos após o cadastro bem-sucedido
        if (result.success) {
            document.getElementById('form').reset(); // Reseta o formulário
        }
    } catch (error) {
        console.error('Erro ao cadastrar aluno:', error);
        showMessage('Erro ao cadastrar aluno. Tente novamente.'); // Mensagem de erro
    }
});


// Função para formatar o telefone
function formatarTelefone(value) {
    value = value.replace(/\D/g, ''); // Remove não numéricos
    if (value.length > 10) {
        return `+55 (${value.substring(2, 4)}) ${value.substring(4, 9)}-${value.substring(9)}`;
    } else if (value.length > 1) {
        return `+55 (${value.substring(2)}) ${value.substring(4)}`;
    } else if (value.length > 0) {
        return `+55 (${value}`;
    }
    return ''; // Retorna vazio se não houver valor
}

// Função para formatar o CPF
function formatarCPF(value) {
    value = value.replace(/\D/g, ''); // Remove não numéricos
    if (value.length > 9) {
        return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
    } else if (value.length > 5) {
        return `${value.substring(0, 3)}.${value.substring(3)}`;
    } else if (value.length > 0) {
        return `${value}`;
    }
    return ''; // Retorna vazio se não houver valor
}

document.getElementById('tel').addEventListener('blur', function (e) {
    e.target.value = formatarTelefone(e.target.value);
});

document.getElementById('cpf').addEventListener('blur', function (e) {
    e.target.value = formatarCPF(e.target.value);
});

// Adicionando evento de input para limpar mensagens ao editar campos
document.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('input', clearMessage);
});