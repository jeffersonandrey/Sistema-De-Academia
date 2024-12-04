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