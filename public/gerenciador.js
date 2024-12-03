document.getElementById("relatorioForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura os valores do formulário
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const cpfAluno = document.getElementById("cpfRelatorio").value.replace(/\D/g, ''); // Remove a formatação do CPF

    // Verificação dos campos obrigatórios
    if (!startDate || !endDate || !cpfAluno) {
        alert("Por favor, preencha as datas de início, fim e o CPF do aluno.");
        return;
    }

    // Função para formatar a data no formato ISO
    function formatToISO(date) {
        const d = new Date(date);
        return d.toISOString();  // Retorna a data no formato ISO 8601
    }

    const startDateFormatted = formatToISO(startDate);
    const endDateFormatted = formatToISO(endDate);

    // Envia os dados para o servidor
    try {
        const response = await fetch("/gerar-relatorio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate: startDateFormatted, endDate: endDateFormatted, cpfAluno }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao gerar relatório.");
        }

        const result = await response.json();

        // Exibe os resultados na página
        const resultadoDiv = document.getElementById("resultado");
        resultadoDiv.innerHTML = `
            <p><strong>Nome do Aluno:</strong> ${result.data.nome_aluno}</p>
            <p><strong>Quantidade de Visitas:</strong> ${result.data.quantidade_visitas}</p>
            <p><strong>Tempo Total:</strong> ${result.data.tempo_total_horas} horas</p>
            <p><strong>Tempo Total (minutos):</strong> ${result.data.tempo_total_minutos} minutos</p>
        `;
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        document.getElementById("resultado").innerText = "Erro ao gerar o relatório: " + error.message;
    }
});


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

// Eventos para formatação de CPF
['cpfRelatorio', 'cpfDelete'].forEach((id) => {
    const cpfInput = document.getElementById(id);

    cpfInput.addEventListener('blur', function () {
        // Formata o CPF quando o campo perde o foco
        this.value = formatarCPF(this.value);
    });

    cpfInput.addEventListener('input', function () {
        // Remove caracteres não numéricos enquanto o usuário digita
        this.value = this.value.replace(/\D/g, '');
    });
});


// Deletar aluno
document.getElementById('deleteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cpfInput = document.getElementById('cpfDelete').value.replace(/\D/g, ''); // Remove a formatação

    const confirmDelete = confirm(`Tem certeza que deseja deletar o aluno com CPF: ${cpfInput}? Esta ação é irreversível.`);

    if (!confirmDelete) return;

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
