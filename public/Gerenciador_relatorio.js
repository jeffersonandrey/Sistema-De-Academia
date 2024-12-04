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
            exibirTabela(data);
        })
        .catch(error => console.error('Erro:', error));
}
function mostrarHorasUltimaSemanaAluno() {
    const cpfAluno = document.getElementById('cpfAluno').value;

    if (!cpfAluno || cpfAluno.length !== 11) {
        alert('Por favor, insira um CPF válido com 11 dígitos.');
        return;
    }

    // Faz a requisição ao backend com o CPF como parâmetro
    fetch(`/getHorasUltimaSemanaAluno?cpf=${cpfAluno}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            exibirTabela(data);
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao buscar dados. Confira o CPF e tente novamente.');
        });
}

function exibirTabela(data) {
    const tabelaContainer = document.getElementById('tabela');
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