function mostrarHorasUltimaSemanaAluno() {
    let cpfAluno = document.getElementById('cpfAluno').value;

    // Remove a formatação do CPF antes de enviar ao backend
    cpfAluno = cpfAluno.replace(/\D/g, '');

    if (!cpfAluno || cpfAluno.length !== 11) {
        alert('Por favor, insira um CPF válido com 11 dígitos.');
        return;
    }

    // Exibe feedback de carregamento
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '<p>Carregando dados...</p>';

    // Faz a requisição ao backend
    fetch(`/getHorasUltimaSemanaAluno?cpf=${cpfAluno}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos:', data);
            exibirTabela(data);
        })
        .catch(error => {
            console.error('Erro:', error);
            tabelaContainer.innerHTML = '<p>Erro ao buscar dados. Confira o CPF e tente novamente.</p>';
        });
}

function obterClassificacao(horas) {
    if (horas <= 5) {
        return 'Iniciante';
    } else if (horas <= 10) {
        return 'Intermediário';
    } else if (horas <= 20) {
        return 'Avançado';
    } else {
        return 'Extremamente Avançado';
    }
}

function exibirTabela(data) {
    const tabelaContainer = document.getElementById('table');
    tabelaContainer.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
        tabelaContainer.innerHTML = '<p>Sem dados para exibir.</p>';
        return;
    }

    // Para exibir um único aluno
    const classificacao = obterClassificacao(data.horas);

    let tabelaHTML = `
        <table class="responsive-table">
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th>Horas</th>
                    <th>Classificação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${data.nome}</td>
                    <td>${data.horas}</td>
                    <td>${classificacao}</td>
                </tr>
            </tbody>
        </table>
    `;

    tabelaContainer.innerHTML = tabelaHTML;
}


function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

// Eventos para formatação de CPF
const cpfInput = document.getElementById('cpfAluno');

cpfInput.addEventListener('blur', function () {
    this.value = formatarCPF(this.value); // Formata o CPF ao perder o foco
});

cpfInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, ''); // Permite digitar apenas números
});
