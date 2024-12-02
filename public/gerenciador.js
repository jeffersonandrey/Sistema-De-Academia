document.getElementById("relatorioForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const cpfAluno = document.getElementById("cpfRelatorio").value;

    if (!startDate || !endDate || !cpfAluno) {
        alert("Por favor, preencha as datas de início, fim e o CPF do aluno.");
        return;
    }

    try {
        const response = await fetch("/gerar-relatorio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ startDate, endDate, cpfAluno }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Erro ao gerar relatório.");
        }

        const result = await response.json();

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
    return '';
}

// Eventos para formatação de CPF
['cpfRelatorio', 'cpfDelete'].forEach((id) => {
    const cpfInput = document.getElementById(id);

    cpfInput.addEventListener('blur', function () {
        this.value = formatarCPF(this.value);
    });

    cpfInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '');
    });
});

// Deletar aluno
document.getElementById('deleteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cpfInput = document.getElementById('cpfDelete').value;

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
