document.getElementById("relatorioForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obter os valores dos campos de data
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const cpfAluno = document.getElementById("cpfRelatorio").value; // Obter o CPF do aluno

    // Verificar se ambos os campos de data e o CPF foram preenchidos
    if (!startDate || !endDate || !cpfAluno) {
        alert("Por favor, preencha as datas de início, fim e o CPF do aluno.");
        return;
    }

    // Verificar se a data inicial não é posterior à data final
    if (new Date(startDate) > new Date(endDate)) {
        alert("A data inicial não pode ser maior que a data final.");
        return;
    }

    try {
        // Enviar os dados de data e CPF para o servidor
        const response = await fetch("/gerar-relatorio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, cpfAluno }), // Enviar CPF do aluno junto com as datas
        });

        // Verificar se a resposta do servidor foi bem-sucedida
        if (!response.ok) {
            throw new Error("Erro ao gerar relatório: " + response.statusText);
        }

        // Processar a resposta do servidor
        const result = await response.json();
        
        // Verificar se há dados para exibir
        const resultadoDiv = document.getElementById("resultado");
        if (result.data && result.data.length > 0) {
            let htmlContent = '<ul>';
            result.data.forEach(item => {
                htmlContent += `<li>Aluno: ${item.nome} | CPF: ${item.cpf}</li>`;
            });
            htmlContent += '</ul>';
            resultadoDiv.innerHTML = htmlContent;
        } else {
            resultadoDiv.innerText = "Nenhum dado encontrado para o intervalo de datas informado.";
        }
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        document.getElementById("resultado").innerText = "Erro ao gerar o relatório: " + error.message;
    }
});

// Função para formatar o CPF
function formatarCPF(value) {
    value = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (value.length > 9) {
        return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
    } else if (value.length > 5) {
        return `${value.substring(0, 3)}.${value.substring(3)}`;
    } else if (value.length > 0) {
        return `${value}`;
    }
    return ''; // Retorna vazio se não houver valor
}

// Eventos para formatação de CPF nos campos dos dois formulários
['cpfRelatorio', 'cpfDelete'].forEach((id) => {
    const cpfInput = document.getElementById(id);

    // Formata o CPF ao sair do campo
    cpfInput.addEventListener('blur', function () {
        this.value = formatarCPF(this.value);
    });

    // Permite apenas números
    cpfInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, ''); // Permite apenas números
    });
});

// Formulário de deletação de aluno
document.getElementById('deleteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cpfInput = document.getElementById('cpfDelete').value;

    // Confirmação antes de deletar
    const confirmDelete = confirm(`Tem certeza que deseja deletar o aluno com CPF: ${cpfInput}? Esta ação é irreversível.`);

    if (!confirmDelete) {
        return;
    }

    console.log('Tentando deletar aluno com CPF:', cpfInput);

    try {
        const response = await fetch(`/deletar-aluno/${cpfInput}`, { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao deletar aluno:', error);
        alert('Erro ao deletar aluno.');
    }
});

// Deletar todos os alunos
document.getElementById('deleteAll').addEventListener('click', async () => {
    if (!confirm('Esta ação é irreversível. Tem certeza que deseja deletar todos os alunos?')) return;

    try {
        const response = await fetch('/deletar-todos-alunos', { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao deletar todos os alunos:', error);
        alert('Erro ao deletar todos os alunos.');
    }
});
