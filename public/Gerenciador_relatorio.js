function mostrarHorasTotais() {
    fetch('/getHorasTotais')  // Rota do servidor para obter as horas totais
        .then(response => response.json())
        .then(data => {
            exibirTabela(data);
        })
        .catch(error => console.error('Erro:', error));
}

function mostrarHorasUltimaSemana() {
    fetch('/getHorasUltimaSemana')  // Rota do servidor para obter as horas na última semana
        .then(response => response.json())
        .then(data => {
            exibirTabelaSemanal(data);
        })
        .catch(error => console.error('Erro:', error));
}
function relatorioClassificaçao() {
    fetch('/getHorasUltimaSemana')  // Rota do servidor para obter as horas na última semana
        .then(response => response.json())
        .then(data => {
            exibirTabelaClass(data);
        })
        .catch(error => console.error('Erro:', error));
}
function exibirTabela(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    let tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th> Total de Horas </th>
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
function exibirTabelaSemanal(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    let tabelaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>  Horas semanais  </th>
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
function exibirTabelaClass(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (data.length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    // Ordenando os alunos por horas de forma decrescente
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
        // Classificando o aluno com base nas horas semanais
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
