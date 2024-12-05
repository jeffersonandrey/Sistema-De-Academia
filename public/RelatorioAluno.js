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
            // Em caso de erro de rede ou status HTTP não esperado
            throw new Error('Erro ao buscar dados: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Dados recebidos:', data);

        // Verificação para CPF não encontrado (ajustar a chave conforme necessário)
        if (data && data.erro === 'Not Found') {
            tabelaContainer.innerHTML = '<p>CPF não encontrado no sistema de alunos.</p>';
        } else if (data && (data.horas === 0 || !data.horas)) {
            // Verifica se há horas registradas para o CPF
            tabelaContainer.innerHTML = '<p>Não há dados de horas para o CPF informado.</p>';
        } else if (data && data.nome && data.horas) {
            // Caso contrário, exibe a tabela com os dados
            exibirTabela(data);
        } else {
            // Caso os dados estejam malformados ou incompletos
            tabelaContainer.innerHTML = '<p>Erro inesperado ao processar os dados. Tente novamente.</p>';
        }
    })
    .catch(error => {
        // Esse erro será disparado apenas para erros reais de rede ou problemas inesperados
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
