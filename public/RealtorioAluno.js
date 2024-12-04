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
    const tabelaDiv = document.getElementById('tabela');
    tabelaDiv.innerHTML = ''; // Limpa a tabela anterior

    // Verifica se os dados retornaram uma mensagem de erro
    if (data.mensagem) {
        tabelaDiv.innerHTML = `<p>${data.mensagem}</p>`;
        return;
    }

    // Cria a tabela para exibir os dados
    const tabela = document.createElement('table');
    tabela.innerHTML = `
        <thead>
            <tr>
                <th>Nome</th>
                <th>Horas de Treino</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>${data.nome}</td>
                <td>${data.horas.toFixed(2)} horas</td>
            </tr>
        </tbody>
    `;
    tabelaDiv.appendChild(tabela);
}
