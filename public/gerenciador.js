// Função para formatar CPF
function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return cpf; 
}

// Eventos para formatação de CPF
['cpfDelete'].forEach((id) => {
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
    const cpfInput = document.getElementById('cpfDelete').value.replace(/\D/g, '');

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
//Função chamada no botão para mostrar horas totais
function mostrarHorasTotais() {
    fetch('/getHorasTotais')  
        .then(response => response.json())
        .then(data => {
            exibirTabela(data);
        })
        .catch(error => console.error('Erro:', error));
}
//Função chamada no botão para mostrar horas da ultima semana
function mostrarHorasUltimaSemana() {
    fetch('/getHorasUltimaSemana')  
        .then(response => response.json())
        .then(data => {
            exibirTabelaSemanal(data);
        })
        .catch(error => console.error('Erro:', error));
}
//Função chamada no botão para mostrar o relatorio dos alunos na ultima semana
function relatorioClassificacao() {
    fetch('/getHorasUltimaSemana')  
        .then(response => response.json())
        .then(data => {
            exibirTabelaClass(data);
        })
        .catch(error => console.error('Erro:', error));
}
//Função para criar a tabela de horas totais
function exibirTabela(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    // Ordena os dados em ordem decrescente de horas
    data.sort((a, b) => b.horas - a.horas);

    let tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Total de Horas</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(aluno => {
        tabelaHTML += `
            <tr>
                <td>${aluno.nome}</td>
                <td>${aluno.horas}</td>
            </tr>
        `;
    });

    tabelaHTML += '</tbody></table>';
    tabelaContainer.innerHTML = tabelaHTML;
}

//Função que cria a tabela semanal
function exibirTabelaSemanal(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    // Ordena os dados em ordem decrescente de horas
    data.sort((a, b) => b.horas - a.horas);

    let tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Horas Semanais</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(aluno => {
        tabelaHTML += `
            <tr>
                <td>${aluno.nome}</td>
                <td>${aluno.horas}</td>
            </tr>
        `;
    });

    tabelaHTML += '</tbody></table>';
    tabelaContainer.innerHTML = tabelaHTML;
}

//função que cria a tabela de classificação
function exibirTabelaClass(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }
    // ordena o dado em ordem decrescente de horas
    data.sort((a, b) => b.horas - a.horas);

    let tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Classificação</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(aluno => {
        let classificacao = '';
        if (aluno.horas <= 5) {
            classificacao = 'Iniciante';
        } else if (aluno.horas <= 10) {
            classificacao = 'Intermediário';
        } else if (aluno.horas <= 20) {
            classificacao = 'Avançado';
        } else {
            classificacao = 'Extremamente Avançado';
        }

        tabelaHTML += `
            <tr>
                <td>${aluno.nome}</td>
                <td>${classificacao}</td>
            </tr>
        `;
    });

    tabelaHTML += '</tbody></table>';
    tabelaContainer.innerHTML = tabelaHTML;
}
